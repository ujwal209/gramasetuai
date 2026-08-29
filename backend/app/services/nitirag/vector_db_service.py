import logging
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database.mongodb import get_mongo_db
from app.schemas.nitirag import (
    NitiragDocumentRecord,
    NitiragChunkRecord,
    NitiragConversationRecord,
    ChatMessageRecord,
)

logger = logging.getLogger("gramsetu.nitirag.vectordb")
logger.setLevel(logging.INFO)

# In-memory fallback structures
_in_memory_docs: List[Dict[str, Any]] = []
_in_memory_chunks: List[Dict[str, Any]] = []
_in_memory_conversations: List[Dict[str, Any]] = []


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


class VectorDbService:
    """
    MongoDB Atlas Vector Database & Gazette Storage Service.
    Stores and queries statutory documents, vector embeddings, and conversation histories.
    """

    # ----------------------------------------------------
    # 1. DOCUMENT CRUD
    # ----------------------------------------------------

    async def save_document(self, doc: NitiragDocumentRecord) -> bool:
        db = get_mongo_db()
        doc_dict = doc.model_dump()
        doc_dict["_id"] = doc.id

        if db is not None:
            try:
                await db.nitirag_documents.update_one(
                    {"_id": doc.id},
                    {"$set": doc_dict},
                    upsert=True
                )
                logger.info(f"Saved document '{doc.title}' ({doc.id}) to MongoDB nitirag_documents collection.")
                return True
            except Exception as e:
                logger.warning(f"MongoDB save_document error: {e}. Storing in memory fallback.")

        # Fallback
        global _in_memory_docs
        _in_memory_docs = [d for d in _in_memory_docs if d.get("id") != doc.id] + [doc_dict]
        return True

    async def update_document(self, doc_id: str, updates: Dict[str, Any]) -> Optional[NitiragDocumentRecord]:
        db = get_mongo_db()
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        if not clean_updates:
            return await self.get_document_by_id(doc_id)

        if db is not None:
            try:
                await db.nitirag_documents.update_one(
                    {"$or": [{"_id": doc_id}, {"id": doc_id}]},
                    {"$set": clean_updates}
                )
                # If title changed, update chunk titles
                if "title" in clean_updates:
                    await db.nitirag_chunks.update_many(
                        {"document_id": doc_id},
                        {"$set": {"document_title": clean_updates["title"]}}
                    )
                return await self.get_document_by_id(doc_id)
            except Exception as e:
                logger.error(f"MongoDB update_document error: {e}")

        # Fallback
        for d in _in_memory_docs:
            if d.get("id") == doc_id:
                d.update(clean_updates)
                return NitiragDocumentRecord(**d)
        return None

    async def save_chunks(self, chunks: List[NitiragChunkRecord]) -> int:
        if not chunks:
            return 0

        db = get_mongo_db()
        chunk_dicts = []
        for c in chunks:
            d = c.model_dump()
            d["_id"] = c.id
            chunk_dicts.append(d)

        if db is not None:
            try:
                doc_id = chunks[0].document_id
                await db.nitirag_chunks.delete_many({"document_id": doc_id})
                await db.nitirag_chunks.insert_many(chunk_dicts)
                logger.info(f"Inserted {len(chunk_dicts)} vectorized chunks to MongoDB nitirag_chunks collection.")
                return len(chunk_dicts)
            except Exception as e:
                logger.warning(f"MongoDB save_chunks error: {e}. Storing in memory fallback.")

        # Fallback
        doc_id = chunks[0].document_id
        global _in_memory_chunks
        _in_memory_chunks = [c for c in _in_memory_chunks if c.get("document_id") != doc_id] + chunk_dicts
        return len(chunk_dicts)

    async def get_all_documents(
        self,
        state: Optional[str] = None,
        department: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> List[NitiragDocumentRecord]:
        db = get_mongo_db()
        results: List[NitiragDocumentRecord] = []

        if db is not None:
            try:
                filter_q: Dict[str, Any] = {}
                if state and state.lower() not in ["all", "all india"]:
                    filter_q["state"] = {"$regex": state, "$options": "i"}
                if department and department.lower() != "all":
                    filter_q["department"] = {"$regex": department, "$options": "i"}
                if search_query:
                    filter_q["$or"] = [
                        {"title": {"$regex": search_query, "$options": "i"}},
                        {"category": {"$regex": search_query, "$options": "i"}},
                        {"gazette_number": {"$regex": search_query, "$options": "i"}},
                        {"summary": {"$regex": search_query, "$options": "i"}},
                    ]

                cursor = db.nitirag_documents.find(filter_q).sort("created_at", -1)
                docs = await cursor.to_list(length=200)
                for d in docs:
                    d["id"] = d.get("id") or str(d.get("_id"))
                    results.append(NitiragDocumentRecord(**d))
                return results
            except Exception as e:
                logger.warning(f"MongoDB get_all_documents error: {e}. Using in-memory fallback.")

        for d in _in_memory_docs:
            results.append(NitiragDocumentRecord(**d))
        return results

    async def get_document_by_id(self, doc_id: str) -> Optional[NitiragDocumentRecord]:
        db = get_mongo_db()
        if db is not None:
            try:
                doc = await db.nitirag_documents.find_one({"$or": [{"_id": doc_id}, {"id": doc_id}]})
                if doc:
                    doc["id"] = doc.get("id") or str(doc.get("_id"))
                    return NitiragDocumentRecord(**doc)
            except Exception as e:
                logger.warning(f"MongoDB get_document_by_id error: {e}")

        for d in _in_memory_docs:
            if d.get("id") == doc_id:
                return NitiragDocumentRecord(**d)
        return None

    async def get_chunks_for_document(self, doc_id: str) -> List[NitiragChunkRecord]:
        db = get_mongo_db()
        results = []
        if db is not None:
            try:
                cursor = db.nitirag_chunks.find({"document_id": doc_id}).sort("chunk_index", 1)
                chunks = await cursor.to_list(length=300)
                for c in chunks:
                    c["id"] = c.get("id") or str(c.get("_id"))
                    results.append(NitiragChunkRecord(**c))
                return results
            except Exception as e:
                logger.warning(f"MongoDB get_chunks_for_document error: {e}")

        for c in _in_memory_chunks:
            if c.get("document_id") == doc_id:
                results.append(NitiragChunkRecord(**c))
        return results

    async def delete_document(self, doc_id: str) -> bool:
        db = get_mongo_db()
        if db is not None:
            try:
                await db.nitirag_documents.delete_many({"$or": [{"_id": doc_id}, {"id": doc_id}]})
                await db.nitirag_chunks.delete_many({"document_id": doc_id})
                logger.info(f"Deleted document {doc_id} and its vector chunks from MongoDB.")
                return True
            except Exception as e:
                logger.error(f"MongoDB delete_document error: {e}")

        global _in_memory_docs, _in_memory_chunks
        _in_memory_docs = [d for d in _in_memory_docs if d.get("id") != doc_id]
        _in_memory_chunks = [c for c in _in_memory_chunks if c.get("document_id") != doc_id]
        return True

    # ----------------------------------------------------
    # 2. VECTOR SIMILARITY SEARCH (WITH DOCUMENT SCOPING)
    # ----------------------------------------------------

    async def search_similar_chunks(
        self,
        query_vector: List[float],
        top_k: int = 4,
        state: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Calculates cosine similarity across stored chunks in MongoDB.
        Supports scoping to specific selected documents.
        """
        db = get_mongo_db()
        candidate_chunks = []

        if db is not None:
            try:
                filter_q: Dict[str, Any] = {}
                if document_ids and len(document_ids) > 0:
                    filter_q["document_id"] = {"$in": document_ids}
                elif state and state.lower() not in ["all", "all india"]:
                    filter_q["state"] = {"$regex": state, "$options": "i"}

                cursor = db.nitirag_chunks.find(filter_q)
                candidate_chunks = await cursor.to_list(length=600)
            except Exception as e:
                logger.warning(f"Error fetching chunks for vector search: {e}")

        if not candidate_chunks:
            if document_ids and len(document_ids) > 0:
                candidate_chunks = [c for c in _in_memory_chunks if c.get("document_id") in document_ids]
            else:
                candidate_chunks = _in_memory_chunks

        # Calculate Cosine Similarity
        scored_chunks = []
        for c in candidate_chunks:
            chunk_vec = c.get("embedding")
            if chunk_vec and isinstance(chunk_vec, list):
                score = _cosine_similarity(query_vector, chunk_vec)
                scored_chunks.append({
                    "chunk": c,
                    "score": round(score, 4),
                })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    # ----------------------------------------------------
    # 3. CONVERSATION SESSIONS CRUD (ChatGPT-Style)
    # ----------------------------------------------------

    async def create_conversation(self, conv: NitiragConversationRecord) -> bool:
        db = get_mongo_db()
        conv_dict = conv.model_dump()
        conv_dict["_id"] = conv.id

        if db is not None:
            try:
                await db.nitirag_conversations.update_one(
                    {"_id": conv.id},
                    {"$set": conv_dict},
                    upsert=True
                )
                logger.info(f"Saved conversation {conv.id} to MongoDB.")
                return True
            except Exception as e:
                logger.warning(f"MongoDB create_conversation error: {e}")

        global _in_memory_conversations
        _in_memory_conversations = [c for c in _in_memory_conversations if c.get("id") != conv.id] + [conv_dict]
        return True

    async def get_conversations(self, user_id: Optional[str] = None) -> List[NitiragConversationRecord]:
        db = get_mongo_db()
        results: List[NitiragConversationRecord] = []

        if db is not None:
            try:
                filter_q: Dict[str, Any] = {}
                if user_id:
                    filter_q["user_id"] = user_id
                cursor = db.nitirag_conversations.find(filter_q).sort("updated_at", -1)
                convs = await cursor.to_list(length=100)
                for c in convs:
                    c["id"] = c.get("id") or str(c.get("_id"))
                    results.append(NitiragConversationRecord(**c))
                return results
            except Exception as e:
                logger.warning(f"MongoDB get_conversations error: {e}")

        for c in _in_memory_conversations:
            results.append(NitiragConversationRecord(**c))
        return results

    async def get_conversation_by_id(self, conv_id: str) -> Optional[NitiragConversationRecord]:
        db = get_mongo_db()
        if db is not None:
            try:
                c = await db.nitirag_conversations.find_one({"$or": [{"_id": conv_id}, {"id": conv_id}]})
                if c:
                    c["id"] = c.get("id") or str(c.get("_id"))
                    return NitiragConversationRecord(**c)
            except Exception as e:
                logger.warning(f"MongoDB get_conversation_by_id error: {e}")

        for c in _in_memory_conversations:
            if c.get("id") == conv_id:
                return NitiragConversationRecord(**c)
        return None

    async def update_conversation(self, conv_id: str, updates: Dict[str, Any]) -> Optional[NitiragConversationRecord]:
        db = get_mongo_db()
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        clean_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        if db is not None:
            try:
                await db.nitirag_conversations.update_one(
                    {"$or": [{"_id": conv_id}, {"id": conv_id}]},
                    {"$set": clean_updates}
                )
                return await self.get_conversation_by_id(conv_id)
            except Exception as e:
                logger.error(f"MongoDB update_conversation error: {e}")

        for c in _in_memory_conversations:
            if c.get("id") == conv_id:
                c.update(clean_updates)
                return NitiragConversationRecord(**c)
        return None

    async def append_message_to_conversation(self, conv_id: str, message: ChatMessageRecord) -> Optional[NitiragConversationRecord]:
        db = get_mongo_db()
        now_iso = datetime.now(timezone.utc).isoformat()
        msg_dict = message.model_dump()

        if db is not None:
            try:
                await db.nitirag_conversations.update_one(
                    {"$or": [{"_id": conv_id}, {"id": conv_id}]},
                    {
                        "$push": {"messages": msg_dict},
                        "$set": {"updated_at": now_iso}
                    }
                )
                return await self.get_conversation_by_id(conv_id)
            except Exception as e:
                logger.error(f"MongoDB append_message error: {e}")

        for c in _in_memory_conversations:
            if c.get("id") == conv_id:
                c.setdefault("messages", []).append(msg_dict)
                c["updated_at"] = now_iso
                return NitiragConversationRecord(**c)
        return None

    async def delete_conversation(self, conv_id: str) -> bool:
        db = get_mongo_db()
        if db is not None:
            try:
                await db.nitirag_conversations.delete_many({"$or": [{"_id": conv_id}, {"id": conv_id}]})
                logger.info(f"Deleted conversation {conv_id} from MongoDB.")
                return True
            except Exception as e:
                logger.error(f"MongoDB delete_conversation error: {e}")

        global _in_memory_conversations
        _in_memory_conversations = [c for c in _in_memory_conversations if c.get("id") != conv_id]
        return True


vector_db_service = VectorDbService()
