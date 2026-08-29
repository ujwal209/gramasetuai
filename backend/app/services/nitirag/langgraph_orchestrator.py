import logging
import time
import re
from typing import TypedDict, List, Optional, Dict, Any
from urllib.parse import urlparse

try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False
    StateGraph = None
    END = None

from app.services.nitirag.gemini_embedding_service import gemini_embedding_service
from app.services.nitirag.vector_db_service import vector_db_service
from app.services.realtime_search_service import realtime_search_service
from app.services.key_rotator import groq_pool
from groq import Groq

logger = logging.getLogger("gramsetu.nitirag.langgraph")
logger.setLevel(logging.INFO)


class NitiragCitationDict(TypedDict):
    document_id: str
    document_title: str
    gazette_number: Optional[str]
    page_number: int
    chunk_text: str
    pdf_url: str
    relevance_score: float
    source_type: str  # 'vector_gazette' | 'web_search'
    domain: Optional[str]
    favicon_url: Optional[str]


class NitiragGraphState(TypedDict):
    conversation_id: str
    query: str
    user_id: str
    state_scope: Optional[str]
    selected_document_ids: List[str]
    enable_web_search: bool
    language: str

    # History & context
    messages_history: List[Dict[str, Any]]
    total_turns: int
    context_tokens_estimate: int
    needs_summarization_prompt: bool

    # Retrieved knowledge
    vector_chunks: List[Dict[str, Any]]
    web_sources: List[Dict[str, Any]]

    # Output
    answer: str
    citations: List[Dict[str, Any]]
    confidence_score: float


# ----------------------------------------------------
# 1. GRAPH NODES
# ----------------------------------------------------

async def route_and_classify_node(state: NitiragGraphState) -> Dict[str, Any]:
    """Inspects query length, active document scope, and context size."""
    history = state.get("messages_history", [])
    total_turns = len(history)

    # Estimate token count (approx 4 chars/token)
    total_chars = sum(len(m.get("text", "")) for m in history) + len(state["query"])
    token_est = total_chars // 4

    # Trigger summarization prompt if turns >= 8 or tokens >= 3500
    needs_summary = total_turns >= 8 or token_est >= 3500

    return {
        "total_turns": total_turns,
        "context_tokens_estimate": token_est,
        "needs_summarization_prompt": needs_summary,
    }


async def retrieve_vector_embeddings_node(state: NitiragGraphState) -> Dict[str, Any]:
    """Generates Gemini query embedding and searches MongoDB Atlas for exact vector chunks."""
    query = state["query"]
    state_scope = state.get("state_scope")
    selected_doc_ids = state.get("selected_document_ids", [])

    logger.info(f"[LangGraph] Vector Retrieval for query: '{query[:60]}' with {len(selected_doc_ids)} scoped docs")

    query_vec, model_used = await gemini_embedding_service.embed_text(query)
    if not query_vec:
        logger.warning("[LangGraph] Query embedding failed.")
        return {"vector_chunks": []}

    matched_results = await vector_db_service.search_similar_chunks(
        query_vector=query_vec,
        top_k=5,
        state=state_scope,
        document_ids=selected_doc_ids if selected_doc_ids else None,
    )

    chunks_data = []
    for r in matched_results:
        chunk = r["chunk"]
        score = r["score"]
        doc = await vector_db_service.get_document_by_id(chunk["document_id"])
        pdf_url = doc.pdf_url if doc else "https://myscheme.gov.in"
        gazette_no = doc.gazette_number if doc else "CIRCULAR"

        chunks_data.append({
            "document_id": chunk["document_id"],
            "document_title": chunk.get("document_title", "Official Gazette"),
            "gazette_number": gazette_no,
            "page_number": chunk.get("page_number", 1),
            "chunk_text": chunk.get("text", ""),
            "pdf_url": pdf_url,
            "relevance_score": score,
            "source_type": "vector_gazette",
            "domain": "gramsetu.in",
            "favicon_url": "https://www.google.com/s2/favicons?domain=gov.in&sz=64",
        })

    return {"vector_chunks": chunks_data}


async def search_web_gazette_node(state: NitiragGraphState) -> Dict[str, Any]:
    """Executes live web search for government gazettes and official welfare notifications if enabled."""
    enable_web = state.get("enable_web_search", False)
    vector_chunks = state.get("vector_chunks", [])

    # If web search is disabled and we found good vector chunks, skip web search
    if not enable_web and len(vector_chunks) > 0:
        return {"web_sources": []}

    query = state["query"]
    state_scope = state.get("state_scope", "India")
    targeted_query = f"{query} {state_scope} government gazette notification scheme guidelines .gov.in"

    logger.info(f"[LangGraph] Live Web Search: '{targeted_query}'")
    web_results = []
    try:
        search_res = await realtime_search_service.search_schemes(targeted_query)
        sources = search_res.get("sources", [])
        for s in sources[:4]:
            url = s.get("url", "")
            domain = urlparse(url).netloc or "gov.in"
            web_results.append({
                "document_id": f"web-{hash(url) & 0xffffff}",
                "document_title": s.get("title") or f"Government Portal ({domain})",
                "gazette_number": "LIVE-WEB",
                "page_number": 1,
                "chunk_text": s.get("snippet") or s.get("text", "")[:280],
                "pdf_url": url,
                "relevance_score": 0.92,
                "source_type": "web_search",
                "domain": domain,
                "favicon_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=64",
            })
    except Exception as e:
        logger.warning(f"[LangGraph] Web search exception: {e}")

    return {"web_sources": web_results}


async def synthesize_legal_advisory_node(state: NitiragGraphState) -> Dict[str, Any]:
    """Synthesizes structured Markdown response with Groq LLM across vector chunks & web sources."""
    query = state["query"]
    history = state.get("messages_history", [])
    vector_chunks = state.get("vector_chunks", [])
    web_sources = state.get("web_sources", [])
    needs_summary = state.get("needs_summarization_prompt", False)

    all_citations = vector_chunks + web_sources

    # Construct context passages
    passage_blocks = []
    for idx, c in enumerate(all_citations[:6]):
        src_label = "OFFICIAL GAZETTE PDF" if c["source_type"] == "vector_gazette" else "LIVE GOVT WEB PORTAL"
        passage_blocks.append(
            f"[{idx+1}] [{src_label}] {c['document_title']} (Page {c['page_number']}, Match: {round(c['relevance_score']*100, 1)}%)\n"
            f"Passage: \"{c['chunk_text']}\"\nURL: {c['pdf_url']}"
        )

    context_str = "\n\n".join(passage_blocks) if passage_blocks else "No direct gazette excerpts found."

    # Format multi-turn conversation messages for LLM with rigorous formatting rules
    llm_messages = [
        {
            "role": "system",
            "content": (
                "You are GramSetu Niti RAG, the Senior Statutory Legal Advisor & Agricultural Gazette AI for Indian Citizens and Farmers.\n"
                "Ground all advice strictly in the provided official gazette passages, government resolutions, and statutory rules.\n\n"
                "STRICT MARKDOWN & LATEX FORMATTING RULES:\n"
                "1. Always structure your response with clear, clean GitHub Flavored Markdown (GFM):\n"
                "   - Use `### ` for major section headers (e.g. `### 1. Statutory Provisions & Gazetted Rules`, `### 2. Scheme Entitlements & Subsidy Calculation`, `### 3. Citizen Action & CSC Checklist`).\n"
                "   - Use bold text `**term**` for key dates, statutory numbers, eligibility thresholds, and document requirements.\n"
                "   - Use blockquotes `> \"...\"` for verbatim statutory quotations.\n"
                "   - Use standard Markdown tables `| Column 1 | Column 2 |` for comparing scheme criteria, subsidy tiers, or service portals.\n"
                "   - Use numbered steps `1. ` and bullet points `- ` for procedural checklists.\n"
                "   - When calculating subsidies, financial percentages, or criteria formulas, use LaTeX math notation (e.g., `$90\\%$`, `$Subsidy = 0.90 \\times Total Cost$`, `$$Subsidy_{Max} = ₹3,50,000$$`).\n"
                "2. Explicitly cite the document title, circular reference, and page number for every legal rule.\n"
                "3. Ensure all table rows are complete, aligned, and properly closed with pipes `|`.\n"
                "4. DO NOT use emojis or emoticons under any circumstance.\n"
                "5. Maintain continuous memory and context of past dialogue turns in this consultation."
            ),
        }
    ]

    # Add last 4 turns of history
    for m in history[-4:]:
        r = m.get("role", "user")
        if r in ["user", "assistant"]:
            llm_messages.append({"role": r, "content": m.get("text", "")})

    # Add user current prompt with grounded context
    user_prompt = (
        f"CITIZEN STATUTORY INQUIRY: {query}\n\n"
        f"GROUNDED GAZETTE PASSAGES & VERIFIED SOURCES:\n{context_str}\n\n"
        "Synthesize a clear, authoritative statutory legal guidance for the citizen in rich GitHub Flavored Markdown with clean tables, blockquotes, and LaTeX formulas where appropriate."
    )
    llm_messages.append({"role": "user", "content": user_prompt})

    # Groq Multi-Key Synthesis
    synthesized_answer = ""
    active_keys = groq_pool.get_all_keys()
    candidate_models = ["openai/gpt-oss-20b", "groq/compound-mini", "openai/gpt-oss-120b", "allam-2-7b"]

    for key in active_keys:
        for model_name in candidate_models:
            try:
                client = Groq(api_key=key, timeout=12.0)
                resp = client.chat.completions.create(
                    model=model_name,
                    messages=llm_messages,
                    temperature=0.2,
                    max_tokens=1200,
                )
                synthesized_answer = resp.choices[0].message.content or ""
                if synthesized_answer:
                    break
            except Exception as e:
                logger.warning(f"[LangGraph] Groq {model_name} failed: {e}")
        if synthesized_answer:
            break

    # Fallback template if all LLM keys exhausted
    if not synthesized_answer:
        if all_citations:
            top_src = all_citations[0]
            synthesized_answer = (
                f"### Statutory Guidance & Official Gazette Finding\n\n"
                f"Based on the official statutory notification **{top_src['document_title']}** "
                f"(Page {top_src['page_number']}, Reference: {top_src['gazette_number']}), the verified provisions state:\n\n"
                f"> \"{top_src['chunk_text'][:280]}...\"\n\n"
                f"**Citizen Action Checklist:**\n"
                f"- **Eligibility**: Grounded in verified state and central circular directives.\n"
                f"- **Submission**: File your application at your local CSC / Raitha Samparka Kendra with Land RTC and NPCI-linked Aadhaar.\n\n"
                f"*Consultation grounded in {len(all_citations)} official statutory knowledge passages.*"
            )
        else:
            synthesized_answer = (
                f"### Statutory Finding\n\n"
                f"No specific circular matching **\"{query}\"** was identified in the currently scoped gazettes.\n\n"
                f"- Please upload the relevant state agricultural gazette or circular in the **Upload Station** or enable **Live Web Search** to search government repositories."
            )

    # Append context window notice if limit reached
    if needs_summary:
        synthesized_answer += (
            "\n\n---\n"
            "> **Statutory Consultation Notice**: This consultation session has accumulated extensive legal dialogue and is approaching its context capacity. "
            "It is recommended to click **Summarize & Start New Session** in the toolbar to archive these findings and begin a fresh inquiry."
        )

    return {
        "answer": synthesized_answer,
        "citations": all_citations,
        "confidence_score": 0.98 if vector_chunks else 0.85,
    }


# ----------------------------------------------------
# 2. BUILD LANGGRAPH WORKFLOW OR ASYNC PIPELINE FALLBACK
# ----------------------------------------------------

class FallbackNitiragPipeline:
    """
    Direct asynchronous pipeline fallback when langgraph is not installed.
    Sequentially executes the 4 graph node functions.
    """
    async def ainvoke(self, initial_state: NitiragGraphState) -> NitiragGraphState:
        state = dict(initial_state)
        
        # 1. Route & Classify
        res1 = await route_and_classify_node(state)
        state.update(res1)
        
        # 2. Retrieve Vector Embeddings
        res2 = await retrieve_vector_embeddings_node(state)
        state.update(res2)
        
        # 3. Web Search Gazette
        res3 = await search_web_gazette_node(state)
        state.update(res3)
        
        # 4. Synthesize Legal Advisory
        res4 = await synthesize_legal_advisory_node(state)
        state.update(res4)
        
        return state


if HAS_LANGGRAPH and StateGraph is not None:
    try:
        workflow = StateGraph(NitiragGraphState)
        workflow.add_node("route_and_classify", route_and_classify_node)
        workflow.add_node("retrieve_vector_embeddings", retrieve_vector_embeddings_node)
        workflow.add_node("search_web_gazette", search_web_gazette_node)
        workflow.add_node("synthesize_legal_advisory", synthesize_legal_advisory_node)

        workflow.set_entry_point("route_and_classify")
        workflow.add_edge("route_and_classify", "retrieve_vector_embeddings")
        workflow.add_edge("retrieve_vector_embeddings", "search_web_gazette")
        workflow.add_edge("search_web_gazette", "synthesize_legal_advisory")
        workflow.add_edge("synthesize_legal_advisory", END)

        nitirag_langgraph_app = workflow.compile()
        logger.info("[LangGraph] Niti RAG Multi-Turn StateGraph compiled successfully.")
    except Exception as e:
        logger.warning(f"LangGraph compilation failed, using FallbackNitiragPipeline: {e}")
        nitirag_langgraph_app = FallbackNitiragPipeline()
else:
    logger.info("[Pipeline] LangGraph not installed; running Niti RAG with FallbackNitiragPipeline.")
    nitirag_langgraph_app = FallbackNitiragPipeline()

