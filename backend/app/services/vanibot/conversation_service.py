import uuid
import logging
from typing import Dict, Any, List, Optional
from app.schemas.vanibot import (
    VaniRespondRequest,
    VaniRespondResponse,
    VaniSchemeCard,
    VaniActionLink,
    VaniSourceCitation,
)
from app.services.realtime_search_service import realtime_search_service, extract_domain, get_favicon_url
from app.services.vanibot.text_to_speech import text_to_speech_service
from app.services.vanibot.language_service import language_service

logger = logging.getLogger("gramsetu.vanibot")

LOCALIZED_HEADERS = {
    "kn": {
        "takeaways": "ಮುಖ್ಯ ಶಾಸನಬದ್ಧ ಸೌಲಭ್ಯಗಳು ಮತ್ತು ನಿಯಮಗಳು:",
        "qualification": "ಅರ್ಹತೆಯ ವಿವರ:",
        "action": "ಮುಂದಿನ ಕ್ರಮ:",
        "audit_docs": "ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ (KagazCheck)",
        "gen_parchaa": "ಅರ್ಜಿ ದಸ್ತಾವೇಜು ತಯಾರಿಸಿ (Parchaa)",
    },
    "hi": {
        "takeaways": "मुख्य लाभ एवं वैधानिक नियम:",
        "qualification": "पात्रता संबंधी सूचना:",
        "action": "अनुशंसित कार्रवाई:",
        "audit_docs": "आवश्यक दस्तावेज़ ऑडिट करें",
        "gen_parchaa": "आवेदन पर्चा तैयार करें",
    },
    "te": {
        "takeaways": "ముఖ్యమైన ప్రయోజనాలు మరియు నిబంధనలు:",
        "qualification": "అర్హత వివరాలు:",
        "action": "చేయవలసిన తదుపరి చర్య:",
        "audit_docs": "అవసరమైన పత్రాలను తనిఖీ చేయండి",
        "gen_parchaa": "దరఖాస్తు పత్రం సిద్ధం చేయండి",
    },
    "ta": {
        "takeaways": "முக்கிய சலுகைகள் மற்றும் விதிகள்:",
        "qualification": "தகுதி அறிவிப்பு:",
        "action": "பரிந்துரைக்கப்பட்ட நடவடிக்கை:",
        "audit_docs": "தேவையான ஆவணங்களை சரிபார்க்கவும்",
        "gen_parchaa": "விண்ணப்ப ஆவணம் தயார் செய்க",
    },
    "mr": {
        "takeaways": "मुख्य लाभ व वैधानिक नियम:",
        "qualification": "पात्रता सूचना:",
        "action": "पुढील कृती:",
        "audit_docs": "आवश्यक कागदपत्रे तपासा",
        "gen_parchaa": "अर्ज पर्चा तयार करा",
    },
    "en": {
        "takeaways": "Key Entitlements & Statutory Rules:",
        "qualification": "Eligibility Notice:",
        "action": "Recommended Action:",
        "audit_docs": "Audit Required Documents",
        "gen_parchaa": "Generate Application Dossier",
    }
}


class VaniBotConversationService:
    """
    Conversational Reasoning Engine for Vani-Bot.
    Combines real-time Tavily statutory search, Trafilatura deep web scraping, Groq model reasoning,
    and Sarvam AI neural speech synthesis.
    """

    def __init__(self):
        self._session_history: Dict[str, List[Dict[str, Any]]] = {}

    async def respond(self, req: VaniRespondRequest) -> VaniRespondResponse:
        session_id = req.session_id or str(uuid.uuid4())
        query = req.query.strip()
        lang = language_service.normalize_language_code(req.language)
        loc = LOCALIZED_HEADERS.get(lang, LOCALIZED_HEADERS["en"])

        state = None
        if req.citizen_profile and isinstance(req.citizen_profile, dict):
            state = req.citizen_profile.get("state")

        logger.info(f"[Vani-Bot] Query received: query='{query}', lang='{lang}', state='{state}'")

        # 1. REALTIME SEARCH & DEEP TRAFILATURA GAZETTE SCRAPING + GROQ SYNTHESIS (IN TARGET LANGUAGE)
        search_res = await realtime_search_service.search_schemes(
            query=query,
            state=state,
            language=lang,
            max_results=6,
        )

        schemes_data = search_res.get("schemes", [])
        sources_data = search_res.get("sources", [])
        ai_overview = search_res.get("ai_overview", {})

        # 2. BUILD STRUCTURED CLEAN MARKDOWN RESPONSE (IN TARGET LANGUAGE)
        reply_markdown_parts = []
        headline = ai_overview.get("headline") or f"Government Welfare Intelligence for {query}"
        summary = ai_overview.get("summary") or "Official government welfare and assistance guidelines."
        takeaways = ai_overview.get("key_takeaways", [])
        qualification = ai_overview.get("primary_qualification")
        action = ai_overview.get("recommended_action")

        reply_markdown_parts.append(f"### {headline}\n")
        reply_markdown_parts.append(f"{summary}\n")

        if takeaways:
            reply_markdown_parts.append(f"\n**{loc['takeaways']}**")
            for t in takeaways:
                reply_markdown_parts.append(f"- **{t}**" if ":" in t else f"- {t}")

        if qualification:
            reply_markdown_parts.append(f"\n> **{loc['qualification']}** {qualification}")

        if action:
            reply_markdown_parts.append(f"\n**{loc['action']}** {action}")

        reply_text = "\n".join(reply_markdown_parts)

        # 3. BUILD SOURCE CITATIONS WITH REAL DOMAIN FAVICONS
        source_citations: List[VaniSourceCitation] = []
        for src in sources_data:
            s_url = src.get("url", "")
            s_domain = src.get("domain") or extract_domain(s_url)
            source_citations.append(
                VaniSourceCitation(
                    title=src.get("title") or s_domain,
                    url=s_url,
                    domain=s_domain,
                    favicon_url=src.get("favicon_url") or get_favicon_url(s_url),
                    snippet=src.get("snippet", ""),
                )
            )

        # 4. BUILD SCHEME CARDS
        scheme_cards: List[VaniSchemeCard] = []
        for s in schemes_data:
            s_url = s.get("official_source_url", "")
            s_domain = s.get("domain") or extract_domain(s_url)
            scheme_cards.append(
                VaniSchemeCard(
                    scheme_id=str(s.get("id", "scheme-001")),
                    scheme_name=str(s.get("name", "Government Program")),
                    category=s.get("category", "Agriculture & Rural Welfare"),
                    state=s.get("state", state or "Central Government"),
                    short_summary=s.get("short_description") or s.get("detailed_description", "")[:180],
                    benefit_amount=s.get("benefit_amount") or (s.get("benefits", ["Direct Benefit"])[0] if s.get("benefits") else "Direct Subsidy"),
                    key_benefits=s.get("benefits", [])[:3],
                    required_documents=s.get("required_documents", [])[:4],
                    official_url=s_url,
                    domain=s_domain,
                    favicon_url=s.get("favicon_url") or get_favicon_url(s_url),
                    kagazcheck_ready=True,
                )
            )

        # 5. ACTION LINKS
        action_links: List[VaniActionLink] = [
            VaniActionLink(
                label=loc["audit_docs"],
                action_type="open_kagazcheck",
                payload={"scheme_id": scheme_cards[0].scheme_id if scheme_cards else "pm-kisan-001"}
            ),
            VaniActionLink(
                label=loc["gen_parchaa"],
                action_type="open_parchaa",
                payload={"scheme_id": scheme_cards[0].scheme_id if scheme_cards else "pm-kisan-001"}
            )
        ]

        # 5. CONSTRUCT DETAILED MARKDOWN AI SUMMARY
        ai_summary_blocks = []
        if headline:
            ai_summary_blocks.append(f"### {headline}")
        if summary:
            ai_summary_blocks.append(f"{summary}")
        if takeaways:
            ai_summary_blocks.append(f"**{loc['takeaways']}**\n" + "\n".join([f"- {t}" for t in takeaways]))
        if qualification:
            ai_summary_blocks.append(f"> **{loc['qualification']}** {qualification}")
        if action:
            ai_summary_blocks.append(f"**{loc['action']}** {action}")

        ai_summary_md = "\n\n".join(ai_summary_blocks) if ai_summary_blocks else reply_text

        # 6. GENERATE NEURAL SPOKEN VOICE VIA SARVAM TTS (Bulbul v2)
        reply_audio_b64 = None
        if req.include_audio:
            try:
                tts_res = await text_to_speech_service.synthesize_speech(
                    text=summary,
                    language=lang,
                )
                if tts_res and tts_res.audio_base64:
                    reply_audio_b64 = tts_res.audio_base64
            except Exception as tts_err:
                logger.warning(f"[Vani-Bot] TTS voice generation warning: {tts_err}")

        suggested_followups = [
            "What mandatory documents are required for this scheme?",
            "How do I apply online through Gram One / CSC?",
            "What is the landholding acreage limit?",
            "Check my family's eligibility status",
        ]

        if session_id not in self._session_history:
            self._session_history[session_id] = []
        self._session_history[session_id].append({"role": "user", "text": query})
        self._session_history[session_id].append({"role": "vani", "text": reply_text})

        return VaniRespondResponse(
            session_id=session_id,
            query=query,
            language=lang,
            intent="scheme_inquiry",
            reply_text=reply_text,
            reply_audio_base64=reply_audio_b64,
            ai_summary=ai_summary_md,
            scheme_cards=scheme_cards,
            action_links=action_links,
            sources=[s.url for s in source_citations],
            source_citations=source_citations,
            suggested_followups=suggested_followups,
        )

    def clear_session(self, session_id: str):
        if session_id in self._session_history:
            del self._session_history[session_id]


conversation_service = VaniBotConversationService()
