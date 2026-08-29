import os
import re
import json
import time
import uuid
from datetime import datetime
import asyncio
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from app.core.config import settings
from app.data.verified_schemes import VERIFIED_SCHEMES_SEED
from app.services.key_rotator import tavily_pool, groq_pool
from app.database.mongodb import get_mongo_db

logger = logging.getLogger("gramsetu.search")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [SchemeSearchEngine] %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)

# Verified Active Groq Models
GROQ_AVAILABLE_MODELS = [
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "groq/compound",
]


def extract_domain(url: str) -> str:
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        if domain.startswith("www."):
            domain = domain[4:]
        return domain.split('/')[0].strip()
    except Exception:
        return "india.gov.in"


def get_favicon_url(url: str) -> str:
    domain = extract_domain(url)
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"


class RealtimeSearchService:
    """
    Official Scheme Discovery & Gazette Verification Engine.
    Discovers live government gazette schemes, generates Chrome-style AI Overview, and extracts citations with favicons using Round-Robin key rotation.
    Optimized for high-speed concurrent scraping and sub-3s LLM synthesis.
    """

    async def _execute_tavily_search(self, search_query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        """
        Executes search with Round-Robin key rotation across available keys with automatic retry on rate limits.
        """
        if not tavily_pool.has_keys():
            logger.warning("No Tavily search keys found in pool.")
            return []

        from tavily import TavilyClient

        keys_to_try = tavily_pool.get_all_keys()
        logger.info(f"Starting Tavily search across {len(keys_to_try)} available keys: query='{search_query}'")

        for attempt, key in enumerate(keys_to_try):
            try:
                masked_key = f"{key[:8]}...{key[-4:]}"
                logger.info(f"[Tavily] Attempt #{attempt + 1} using Key {masked_key}")
                client = TavilyClient(api_key=key)
                response = client.search(
                    query=search_query,
                    search_depth="basic",
                    max_results=max_results,
                    include_domains=["gov.in", "nic.in", "myscheme.gov.in", "dbtbharat.gov.in", "india.gov.in", "karnataka.gov.in", "vikaspedia.in", "pmkisan.gov.in", "agricoop.nic.in"],
                )
                results = response.get("results", [])
                if results:
                    logger.info(f"[Tavily] Succeeded with key #{attempt + 1}! Retrieved {len(results)} official government portals.")
                    return results
            except Exception as e:
                logger.warning(f"[Tavily] Key #{attempt + 1} failed: {e}. Rotating to next key in pool...")
                continue

        return []

    async def _execute_groq_synthesis(self, prompt: str) -> Optional[str]:
        """
        Executes summary synthesis across Round-Robin keys and available model fallbacks.
        """
        if not groq_pool.has_keys():
            logger.warning("No Groq keys found in pool.")
            return None

        from groq import Groq

        keys_to_try = groq_pool.get_all_keys()
        logger.info(f"Starting Groq AI synthesis across {len(keys_to_try)} keys and active models: {GROQ_AVAILABLE_MODELS}")

        for key_idx, key in enumerate(keys_to_try):
            masked_key = f"{key[:8]}...{key[-4:]}"
            client = Groq(api_key=key)
            for model_name in GROQ_AVAILABLE_MODELS:
                try:
                    logger.info(f"[Groq] Key #{key_idx + 1} ({masked_key}) trying model: '{model_name}'")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are the official GramSetu Civic Welfare Intelligence Engine. Output strictly valid JSON containing an ai_overview object and schemes array."
                            },
                            {"role": "user", "content": prompt},
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.1,
                    )
                    content = completion.choices[0].message.content
                    if content:
                        logger.info(f"[Groq] Succeeded with model '{model_name}' on Key #{key_idx + 1}! Generated {len(content)} characters of structured JSON.")
                        return content
                except Exception as model_err:
                    logger.warning(f"[Groq] Model '{model_name}' with Key #{key_idx + 1} failed: {model_err}. Trying fallback...")
                    continue

        return None

    async def _scrape_single_url(self, client: httpx.AsyncClient, res: Dict[str, Any], trafilatura_mod) -> Optional[Dict[str, Any]]:
        target_url = res.get("url")
        if not target_url:
            return None
        domain = extract_domain(target_url)
        source_title = res.get("title") or domain
        favicon = get_favicon_url(target_url)
        snippet = res.get("content", "")[:280]

        try:
            resp = await client.get(
                target_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"},
                timeout=3.5,
            )
            if resp.status_code == 200 and trafilatura_mod:
                downloaded_text = trafilatura_mod.extract(
                    resp.text,
                    include_links=False,
                    output_format="txt",
                    include_tables=True,
                )
                if downloaded_text and len(downloaded_text.strip()) > 50:
                    return {
                        "url": target_url,
                        "title": source_title,
                        "domain": domain,
                        "favicon_url": favicon,
                        "snippet": snippet,
                        "text": downloaded_text[:2500],
                    }
        except Exception:
            pass

        # Return snippet fallback if deep scrape times out
        return {
            "url": target_url,
            "title": source_title,
            "domain": domain,
            "favicon_url": favicon,
            "snippet": snippet,
            "text": snippet,
        }

    async def search_schemes(
        self,
        query: str,
        state: Optional[str] = None,
        language: str = "en",
        max_results: int = 6,
    ) -> Dict[str, Any]:
        start_time = time.time()
        query_clean = query.strip()
        logger.info(f"=== SCHEME SEARCH REQUEST STARTED: query='{query_clean}', state='{state}' ===")

        sources: List[Dict[str, Any]] = []
        schemes_extracted: List[Dict[str, Any]] = []
        ai_overview: Dict[str, Any] = {}

        # 1. LIVE OFFICIAL PORTAL SEARCH (Round-Robin)
        search_query = f"{query_clean} government scheme benefits eligibility official portal guidelines"
        if state and state.lower() not in ["all", "all india"]:
            search_query += f" {state}"

        raw_search_results = await self._execute_tavily_search(search_query, max_results=max_results)

        # 2. CONCURRENT PARALLEL EXTRACTION (Trafilatura & Clean HTTP)
        extracted_articles: List[Dict[str, Any]] = []
        if raw_search_results:
            try:
                import trafilatura
            except Exception:
                trafilatura = None

            for res in raw_search_results:
                target_url = res.get("url")
                if target_url:
                    domain = extract_domain(target_url)
                    source_title = res.get("title") or domain
                    favicon = get_favicon_url(target_url)
                    snippet = res.get("content", "")[:280]

                    if not any(s["url"] == target_url for s in sources):
                        sources.append({
                            "title": source_title,
                            "url": target_url,
                            "domain": domain,
                            "favicon_url": favicon,
                            "snippet": snippet,
                        })

            # Run parallel scraping with asyncio.gather
            async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
                tasks = [self._scrape_single_url(client, res, trafilatura) for res in raw_search_results[:4]]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for r in results:
                    if isinstance(r, dict) and r.get("text"):
                        extracted_articles.append(r)

            logger.info(f"[Trafilatura] Concurrently extracted {len(extracted_articles)} web pages for context.")

        # 3. DYNAMIC STATUTORY SYNTHESIS WITH GROQ (AI OVERVIEW + SCHEMES)
        context_parts = []
        if extracted_articles:
            for a in extracted_articles:
                context_parts.append(f"Source URL: {a['url']}\nSource Title: {a['title']}\nOfficial Text:\n{a['text']}")
        elif sources:
            for s in sources:
                context_parts.append(f"Source URL: {s['url']}\nSource Title: {s['title']}\nSnippet: {s['snippet']}")

        context_str = "\n\n---\n\n".join(context_parts) if context_parts else "Official Government Gazette & Ministry Repository"

        LANG_MAP = {
            "kn": "KANNADA (ಕನ್ನಡ - ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ)",
            "hi": "HINDI (हिन्दी - देवनागरी लिपि)",
            "te": "TELUGU (తెలుగు - తెలుగు లిపి)",
            "ta": "TAMIL (தமிழ் - தமிழ் எழுத்து)",
            "mr": "MARATHI (मराठी - देवनागरी लिपि)",
            "bn": "BENGALI (বাংলা - বাংলা লিপি)",
            "gu": "GUJARATI (ગુજરાતી - ગુજરાતી લિપિ)",
            "en": "ENGLISH",
        }
        target_lang_str = LANG_MAP.get(language, "ENGLISH")

        if language == "en":
            lang_instruction = """
CRITICAL LANGUAGE MANDATE:
The citizen selected language: ENGLISH.
You MUST write all output fields (headline, summary, key_takeaways, primary_qualification, recommended_action, short_description, detailed_description, benefits, eligibility_criteria, required_documents, application_process) EXCLUSIVELY in clear, professional ENGLISH.
Do NOT output Hindi, Devanagari script, or other languages when English is selected.
"""
        else:
            lang_instruction = f"""
CRITICAL LANGUAGE MANDATE:
The citizen selected language: {target_lang_str}.
You MUST write all output fields (headline, summary, key_takeaways, primary_qualification, recommended_action, short_description, detailed_description, benefits, eligibility_criteria, required_documents, application_process) ENTIRELY in {target_lang_str}.
Do NOT output English sentences for {target_lang_str} requests, and do NOT default to Hindi unless Hindi was explicitly requested.
Maintain statutory amounts (₹6,000, 90%, 2026) and acronyms (PM-KISAN, KCC, DBT, CSC) clearly.
"""

        prompt = f"""
You are the official GramSetu Civic Welfare Intelligence Engine.
Extract and synthesize comprehensive, realistic, and highly accurate government scheme intelligence for the citizen search query: "{query_clean}".
State Scope: {state or 'All India (Central & State Schemes)'}

{lang_instruction}

LIVE GOVERNMENT CONTEXT:
{context_str}

OUTPUT FORMAT:
Output strictly a JSON object with this structure:
{{
  "ai_overview": {{
    "headline": "Concise verified statutory headline in target language",
    "summary": "2-3 comprehensive sentences explaining citizen entitlement, official budget, and latest gazette guidelines in target language.",
    "key_takeaways": [
      "Key point 1: Specific benefit amounts, subsidies, or direct transfers",
      "Key point 2: Eligibility conditions and land/category criteria",
      "Key point 3: Essential statutory documents and portal procedures"
    ],
    "primary_qualification": "Clear deterministic qualification criteria in target language",
    "recommended_action": "Clear next action step (e.g. apply online or visit CSC) in target language"
  }},
  "schemes": [
    {{
      "id": "unique-kebab-id",
      "name": "Full Official Scheme Name",
      "category": "Agriculture | Direct Benefit Transfer | Housing | Irrigation | Women Welfare",
      "state": "Karnataka | Uttar Pradesh | Central | All India",
      "short_description": "1-2 sentence concise summary in target language",
      "detailed_description": "Detailed explanation of the scheme, provisions, and fund sharing in target language",
      "benefit_amount": "Specific financial assistance (e.g. ₹6,000/year, Up to 90% Subsidy, ₹1.20 Lakh)",
      "benefits": [
        "Benefit bullet 1 in target language",
        "Benefit bullet 2 in target language"
      ],
      "eligibility_criteria": [
        "Criteria 1 in target language",
        "Criteria 2 in target language"
      ],
      "required_documents": [
        "Aadhaar Card",
        "Pahani / RTC / 7-12 Record",
        "Bank Passbook seeded with NPCI DBT"
      ],
      "application_process": "Step-by-step application guidance in target language",
      "official_source_url": "https://official.gov.in"
    }}
  ]
}}
"""

        groq_json_str = await self._execute_groq_synthesis(prompt)

        if groq_json_str:
            try:
                clean_json = groq_json_str.strip()
                if clean_json.startswith("```"):
                    clean_json = re.sub(r'^```[a-zA-Z]*\n', '', clean_json)
                    clean_json = re.sub(r'\n```$', '', clean_json).strip()
                parsed = json.loads(clean_json)
                ai_overview = parsed.get("ai_overview", {})
                raw_schemes = parsed.get("schemes", [])

                for sc in raw_schemes:
                    sc_url = sc.get("official_source_url") or (sources[0]["url"] if sources else "https://myscheme.gov.in")
                    sc_domain = extract_domain(sc_url)
                    sc_fav = get_favicon_url(sc_url)

                    schemes_extracted.append({
                        "id": sc.get("id") or f"scheme-{re.sub(r'[^a-zA-Z0-9]', '-', sc.get('name', 'gov-scheme').lower())[:30]}",
                        "name": sc.get("name", "Government Scheme"),
                        "category": sc.get("category", "Agriculture & Rural Development"),
                        "state": sc.get("state") or state or "Central",
                        "short_description": sc.get("short_description", ""),
                        "detailed_description": sc.get("detailed_description", ""),
                        "benefit_amount": sc.get("benefit_amount", "Statutory Benefit"),
                        "benefits": sc.get("benefits", []),
                        "eligibility_criteria": sc.get("eligibility_criteria", []),
                        "required_documents": sc.get("required_documents", []),
                        "application_process": sc.get("application_process", "Apply via official portal or local CSC center."),
                        "official_source_url": sc_url,
                        "domain": sc_domain,
                        "favicon_url": sc_fav,
                        "match_score": 0.95,
                    })

                logger.info(f"Parsed synthesized payload: schemes={len(schemes_extracted)}, ai_overview_headline='{ai_overview.get('headline', '')}'")
            except Exception as parse_err:
                logger.warning(f"Error parsing Groq JSON output: {parse_err}. Content was:\n{groq_json_str[:500]}")

        # 4. FALLBACK TO SEED DATA IF NEEDED
        if not schemes_extracted:
            logger.info("Falling back to verified seed schemes matching query.")
            query_lower = query_clean.lower()
            matched_seed = [
                s for s in VERIFIED_SCHEMES_SEED
                if query_lower in s["name"].lower() or query_lower in s["category"].lower() or any(query_lower in b.lower() for b in s.get("benefits", []))
            ]
            if not matched_seed:
                matched_seed = VERIFIED_SCHEMES_SEED[:4]

            for s in matched_seed:
                s_url = s.get("official_source_url", "https://myscheme.gov.in")
                schemes_extracted.append({
                    "id": s["id"],
                    "name": s["name"],
                    "category": s["category"],
                    "state": s["state"],
                    "short_description": s["short_description"],
                    "detailed_description": s["detailed_description"],
                    "benefit_amount": s.get("benefit_amount", "Govt Assistance"),
                    "benefits": s.get("benefits", []),
                    "eligibility_criteria": s.get("eligibility_criteria", []),
                    "required_documents": s.get("required_documents", []),
                    "application_process": s.get("application_process", "Apply at nearest CSC or Raitha Samparka Kendra."),
                    "official_source_url": s_url,
                    "domain": extract_domain(s_url),
                    "favicon_url": get_favicon_url(s_url),
                    "match_score": 0.90,
                })

            if not ai_overview:
                ai_overview = {
                    "headline": f"Government Welfare & Statutory Assistance for {query_clean.title()}",
                    "summary": f"Official verified agricultural and civic schemes supporting farmers for {query_clean}. Benefits include capital subsidies and direct bank transfers.",
                    "key_takeaways": [
                        f"Direct benefit transfer assistance under central and {state or 'state'} government provisions.",
                        "Requires verified Survey Number RTC/Pahani and Aadhaar NPCI bank linkage.",
                        "Applications accepted online or through Gram Panchayat / CSC centers."
                    ],
                    "primary_qualification": "Registered small/marginal farmer or citizen meeting state criteria",
                    "recommended_action": "Generate Parchaa pre-filled application form for CSC verification."
                }

        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(f"=== SCHEME SEARCH COMPLETE in {execution_time_ms}ms: {len(schemes_extracted)} schemes, {len(sources)} sources ===")

        return {
            "query": query_clean,
            "state": state,
            "language": language,
            "ai_overview": ai_overview,
            "schemes": schemes_extracted,
            "sources": sources,
            "execution_time_ms": execution_time_ms,
            "engine": "GramSetu-Hybrid-Live-Engine",
        }

    async def save_search_history(
        self,
        user_id: str,
        query: str,
        state: Optional[str],
        language: str,
        ai_overview: Dict[str, Any],
        schemes: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        execution_time_ms: float,
    ) -> str:
        """Persists a search execution to MongoDB Atlas collection scheme_search_history."""
        history_id = f"search-{uuid.uuid4().hex[:12]}"
        record = {
            "id": history_id,
            "user_id": user_id or "citizen",
            "query": query,
            "state": state or "All India",
            "language": language or "en",
            "ai_overview": ai_overview or {},
            "schemes_count": len(schemes),
            "schemes": schemes or [],
            "sources": sources or [],
            "execution_time_ms": execution_time_ms,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            db = get_mongo_db()
            if db is not None:
                await db["scheme_search_history"].insert_one(record)
                logger.info(f"[History] Saved scheme search '{history_id}' for user '{user_id}' in MongoDB.")
                return history_id
        except Exception as e:
            logger.warning(f"[History] MongoDB save failed: {e}. Storing in memory fallback.")

        # In-memory fallback
        global _in_memory_search_history
        _in_memory_search_history[history_id] = record
        return history_id

    async def get_search_history(self, user_id: Optional[str] = None, limit: int = 30) -> List[Dict[str, Any]]:
        """Retrieves recent searches sorted by created_at desc."""
        try:
            db = get_mongo_db()
            if db is not None:
                query_filter = {}
                if user_id and user_id != "citizen":
                    query_filter = {"$or": [{"user_id": user_id}, {"user_id": "citizen"}]}
                cursor = db["scheme_search_history"].find(query_filter, {"_id": 0}).sort("created_at", -1).limit(limit)
                records = await cursor.to_list(length=limit)
                if records:
                    return records
        except Exception as e:
            logger.warning(f"[History] MongoDB retrieval failed: {e}")

        # Fallback to in-memory
        global _in_memory_search_history
        records = list(_in_memory_search_history.values())
        if user_id and user_id != "citizen":
            records = [r for r in records if r.get("user_id") in [user_id, "citizen"]]
        records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return records[:limit]

    async def get_search_history_by_id(self, history_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single search history record by ID."""
        try:
            db = get_mongo_db()
            if db is not None:
                record = await db["scheme_search_history"].find_one({"id": history_id}, {"_id": 0})
                if record:
                    return record
        except Exception as e:
            logger.warning(f"[History] MongoDB find by id failed: {e}")

        global _in_memory_search_history
        return _in_memory_search_history.get(history_id)

    async def delete_search_history_item(self, history_id: str) -> bool:
        """Deletes a search history record from MongoDB."""
        try:
            db = get_mongo_db()
            if db is not None:
                res = await db["scheme_search_history"].delete_one({"id": history_id})
                return res.deleted_count > 0
        except Exception as e:
            logger.warning(f"[History] MongoDB delete failed: {e}")

        global _in_memory_search_history
        if history_id in _in_memory_search_history:
            del _in_memory_search_history[history_id]
            return True
        return False

    async def clear_search_history(self, user_id: Optional[str] = None) -> bool:
        """Clears search history for a user."""
        try:
            db = get_mongo_db()
            if db is not None:
                query_filter = {}
                if user_id and user_id != "citizen":
                    query_filter = {"user_id": user_id}
                await db["scheme_search_history"].delete_many(query_filter)
                return True
        except Exception as e:
            logger.warning(f"[History] MongoDB clear failed: {e}")

        global _in_memory_search_history
        _in_memory_search_history.clear()
        return True


_in_memory_search_history: Dict[str, Dict[str, Any]] = {}
realtime_search_service = RealtimeSearchService()
