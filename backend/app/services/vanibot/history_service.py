import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.database.mongodb import get_mongo_db
from app.schemas.vanibot import VaniConversationRecord, SaveConversationRequest

logger = logging.getLogger(__name__)

# Clean empty in-memory fallback - zero hardcoding
_in_memory_conversations: List[Dict[str, Any]] = []


def _generate_ai_summary(query: str, response: str, language: str) -> str:
    """
    Generates a structured, rich Markdown statutory AI summary of the citizen's voice call.
    """
    clean_resp = response.strip()
    if clean_resp.startswith("###") or "- " in clean_resp or "**" in clean_resp:
        return clean_resp

    query_clean = query.strip()[:140]
    return (
        f"### Statutory Guidance & Findings\n\n"
        f"**Citizen Spoken Inquiry:** *\"{query_clean}\"*\n\n"
        f"**Official Welfare Rules:**\n"
        f"{clean_resp or 'Citizen was provided official government gazette rules.'}\n\n"
        f"> **Recommended Action:** Generate Parchaa single-page verified application and confirm land records at CSC / Gram Panchayat."
    )


def _generate_title(query: str) -> str:
    words = query.strip().split()
    if len(words) > 8:
        return " ".join(words[:8]) + "..."
    return query.strip() or "Voice Advisory Session"


async def save_conversation(req: SaveConversationRequest) -> VaniConversationRecord:
    db = get_mongo_db()
    conv_id = f"conv-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    title = req.title or _generate_title(req.query_text)
    ai_summary = req.ai_summary or _generate_ai_summary(req.query_text, req.response_text, req.language)

    doc = {
        "_id": conv_id,
        "id": conv_id,
        "user_id": req.user_id or "citizen",
        "session_id": req.session_id,
        "title": title,
        "language": req.language,
        "query_text": req.query_text,
        "response_text": req.response_text,
        "audio_url": req.audio_url,
        "ai_summary": ai_summary,
        "schemes_matched": req.schemes_matched or [],
        "detected_intent": req.detected_intent or "general_agri_advisory",
        "duration_seconds": req.duration_seconds or 12,
        "turns": req.turns or [],
        "created_at": now_iso,
    }

    if db is not None:
        try:
            col = db["vani_conversations"]
            await col.insert_one(doc)
            logger.info(f"Saved Vani conversation {conv_id} to MongoDB")
        except Exception as e:
            logger.warning(f"Failed to save to Mongo, keeping in memory: {e}")
            _in_memory_conversations.insert(0, doc)
    else:
        _in_memory_conversations.insert(0, doc)

    return VaniConversationRecord(
        id=doc["id"],
        user_id=doc.get("user_id"),
        session_id=doc["session_id"],
        title=doc["title"],
        language=doc["language"],
        query_text=doc["query_text"],
        response_text=doc["response_text"],
        audio_url=doc.get("audio_url"),
        ai_summary=doc.get("ai_summary"),
        schemes_matched=doc.get("schemes_matched", []),
        detected_intent=doc.get("detected_intent"),
        duration_seconds=doc.get("duration_seconds", 12),
        turns=doc.get("turns", []),
        created_at=doc.get("created_at"),
    )


async def get_conversations(user_id: Optional[str] = None, session_id: Optional[str] = None) -> List[VaniConversationRecord]:
    db = get_mongo_db()
    results = []

    if db is not None:
        try:
            col = db["vani_conversations"]
            query: Dict[str, Any] = {}
            if user_id:
                query["$or"] = [{"user_id": user_id}, {"user_id": "citizen"}, {"user_id": "anonymous"}]
            if session_id:
                query["session_id"] = session_id

            cursor = col.find(query).sort("created_at", -1).limit(50)
            async for d in cursor:
                results.append(
                    VaniConversationRecord(
                        id=str(d.get("_id") or d.get("id")),
                        user_id=d.get("user_id"),
                        session_id=d.get("session_id", "default"),
                        title=d.get("title", "Voice Session"),
                        language=d.get("language", "kn"),
                        query_text=d.get("query_text", ""),
                        response_text=d.get("response_text", ""),
                        audio_url=d.get("audio_url"),
                        ai_summary=d.get("ai_summary"),
                        schemes_matched=d.get("schemes_matched", []),
                        detected_intent=d.get("detected_intent"),
                        duration_seconds=d.get("duration_seconds", 12),
                        turns=d.get("turns", []),
                        created_at=d.get("created_at"),
                    )
                )
            return results
        except Exception as e:
            logger.warning(f"Error reading vani_conversations from MongoDB: {e}")

    # Fallback in-memory (returns [] if empty)
    filtered = _in_memory_conversations
    if session_id:
        filtered = [c for c in filtered if c.get("session_id") == session_id]
    
    return [
        VaniConversationRecord(
            id=d["id"],
            user_id=d.get("user_id"),
            session_id=d["session_id"],
            title=d["title"],
            language=d["language"],
            query_text=d["query_text"],
            response_text=d["response_text"],
            audio_url=d.get("audio_url"),
            ai_summary=d.get("ai_summary"),
            schemes_matched=d.get("schemes_matched", []),
            detected_intent=d.get("detected_intent"),
            duration_seconds=d.get("duration_seconds", 12),
            turns=d.get("turns", []),
            created_at=d.get("created_at"),
        )
        for d in filtered
    ]


async def get_conversation_by_id(conv_id: str) -> Optional[VaniConversationRecord]:
    db = get_mongo_db()
    if db is not None:
        try:
            col = db["vani_conversations"]
            d = await col.find_one({"$or": [{"_id": conv_id}, {"id": conv_id}]})
            if d:
                return VaniConversationRecord(
                    id=str(d.get("_id") or d.get("id")),
                    user_id=d.get("user_id"),
                    session_id=d.get("session_id", "default"),
                    title=d.get("title", "Voice Session"),
                    language=d.get("language", "kn"),
                    query_text=d.get("query_text", ""),
                    response_text=d.get("response_text", ""),
                    audio_url=d.get("audio_url"),
                    ai_summary=d.get("ai_summary"),
                    schemes_matched=d.get("schemes_matched", []),
                    detected_intent=d.get("detected_intent"),
                    duration_seconds=d.get("duration_seconds", 12),
                    turns=d.get("turns", []),
                    created_at=d.get("created_at"),
                )
        except Exception as e:
            logger.warning(f"Error fetching conversation by id {conv_id}: {e}")

    # Fallback
    for d in _in_memory_conversations:
        if d.get("id") == conv_id or d.get("_id") == conv_id:
            return VaniConversationRecord(
                id=d["id"],
                user_id=d.get("user_id"),
                session_id=d["session_id"],
                title=d["title"],
                language=d["language"],
                query_text=d["query_text"],
                response_text=d["response_text"],
                audio_url=d.get("audio_url"),
                ai_summary=d.get("ai_summary"),
                schemes_matched=d.get("schemes_matched", []),
                detected_intent=d.get("detected_intent"),
                duration_seconds=d.get("duration_seconds", 12),
                turns=d.get("turns", []),
                created_at=d.get("created_at"),
            )
    return None


async def delete_conversation(conv_id: str) -> bool:
    global _in_memory_conversations
    db = get_mongo_db()
    deleted = False

    if db is not None:
        try:
            col = db["vani_conversations"]
            res = await col.delete_one({"$or": [{"_id": conv_id}, {"id": conv_id}]})
            deleted = res.deleted_count > 0
        except Exception as e:
            logger.warning(f"Error deleting conversation {conv_id}: {e}")

    _in_memory_conversations = [c for c in _in_memory_conversations if c.get("id") != conv_id and c.get("_id") != conv_id]
    return deleted or True
