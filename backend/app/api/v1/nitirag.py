import uuid
import time
import logging
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.schemas.nitirag import (
    UploadGazetteResponse,
    NitiragDocumentRecord,
    NitiragChunkRecord,
    NitiragDocumentListResponse,
    UpdateDocumentRequest,
    NitiragModelInfo,
    NitiragQueryRequest,
    NitiragQueryResponse,
    NitiragCitation,
    NitiragConversationRecord,
    CreateConversationRequest,
    UpdateConversationRequest,
    NitiragChatTurnRequest,
    ChatMessageRecord,
    SummarizeAndForkRequest,
)
from app.services.cloudinary_service import cloudinary_service
from app.services.nitirag.pdf_processor import pdf_processor
from app.services.nitirag.gemini_embedding_service import gemini_embedding_service
from app.services.nitirag.vector_db_service import vector_db_service
from app.services.nitirag.langgraph_orchestrator import nitirag_langgraph_app
from app.services.key_rotator import gemini_pool, groq_pool
from groq import Groq

logger = logging.getLogger("gramsetu.api.nitirag")
router = APIRouter(prefix="/nitirag", tags=["Niti RAG"])


# ----------------------------------------------------
# 1. ENGINE HEALTH & MODEL INFO
# ----------------------------------------------------

@router.get("/models", response_model=NitiragModelInfo)
async def get_embedding_models_info():
    status = gemini_embedding_service.get_pool_status()
    current_key = gemini_pool.get_all_keys()[0] if gemini_pool.has_keys() else None
    masked_key = f"{current_key[:8]}...{current_key[-4:]}" if current_key and len(current_key) > 12 else None

    return NitiragModelInfo(
        active_models=status.get("models", []),
        total_gemini_keys=status.get("total_keys", 0),
        current_key_preview=masked_key,
        status="HEALTHY" if status.get("has_keys") else "NO_KEYS_CONFIGURED",
    )


# ----------------------------------------------------
# 2. DOCUMENT INGESTION & CRUD ENDPOINTS
# ----------------------------------------------------

@router.post("/upload", response_model=UploadGazetteResponse)
async def upload_and_vectorize_gazette(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    state: str = Form("All India"),
    department: str = Form("Agriculture & Farmers Welfare"),
    category: str = Form("Statutory Welfare & Subsidies"),
    gazette_number: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported for Niti RAG.")

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")

    doc_id = f"doc-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_filename = file.filename

    logger.info(f"=== STARTING NITI RAG INGESTION for '{clean_filename}' ({len(pdf_bytes)} bytes) ===")

    # 1. Cloudinary Upload
    cloudinary_res = await cloudinary_service.upload_pdf(
        file_bytes=pdf_bytes,
        file_name=clean_filename,
        folder="nitirag_gazettes",
    )
    pdf_url = cloudinary_res.get("secure_url")

    # 2. PyPDF Extraction & Chunking
    raw_chunks, metadata = pdf_processor.extract_and_chunk_pdf(
        pdf_bytes=pdf_bytes,
        chunk_size=650,
        chunk_overlap=120,
    )

    doc_title = title or metadata.get("detected_title") or clean_filename.replace(".pdf", "").replace("_", " ").title()

    # 3. Gemini Vector Embeddings (Round-Robin)
    chunk_texts = [c["text"] for c in raw_chunks]
    embeddings_list, model_used = await gemini_embedding_service.embed_batch(chunk_texts)

    # 4. Prepare Chunk Records
    chunk_records: List[NitiragChunkRecord] = []
    for idx, (raw_c, vec) in enumerate(zip(raw_chunks, embeddings_list)):
        chunk_id = f"chk-{doc_id}-{raw_c['page_number']}-{idx}"
        chunk_records.append(
            NitiragChunkRecord(
                id=chunk_id,
                document_id=doc_id,
                document_title=doc_title,
                state=state,
                department=department,
                page_number=raw_c["page_number"],
                chunk_index=raw_c["chunk_index"],
                text=raw_c["text"],
                embedding=vec,
                embedding_model=model_used,
                created_at=now_iso,
            )
        )

    # 5. Prepare Document Record
    summary_preview = raw_chunks[0]["text"][:240] + "..." if raw_chunks else "Official statutory circular."

    doc_record = NitiragDocumentRecord(
        id=doc_id,
        title=doc_title,
        state=state,
        department=department,
        category=category,
        gazette_number=gazette_number or f"GAZ-{uuid.uuid4().hex[:6].upper()}",
        pdf_url=pdf_url,
        file_name=clean_filename,
        file_size_bytes=len(pdf_bytes),
        total_pages=metadata.get("total_pages", 1),
        total_chunks=len(chunk_records),
        embedding_model_used=model_used,
        status="INDEXED",
        uploaded_by=user_id or "citizen",
        created_at=now_iso,
        summary=summary_preview,
    )

    # 6. MongoDB Atlas Persistence
    await vector_db_service.save_document(doc_record)
    await vector_db_service.save_chunks(chunk_records)

    return UploadGazetteResponse(
        success=True,
        message=f"Successfully indexed '{doc_title}' across {len(chunk_records)} knowledge points.",
        document=doc_record,
        chunks_created=len(chunk_records),
        embedding_model=model_used,
    )


@router.get("/documents", response_model=NitiragDocumentListResponse)
async def list_gazette_documents(
    state: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
):
    docs = await vector_db_service.get_all_documents(state=state, department=department, search_query=query)
    return NitiragDocumentListResponse(
        total=len(docs),
        documents=docs,
    )


@router.get("/documents/{document_id}")
async def get_gazette_document_detail(document_id: str):
    doc = await vector_db_service.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Gazette document not found.")

    chunks = await vector_db_service.get_chunks_for_document(document_id)
    return {
        "document": doc,
        "chunks": chunks,
    }


@router.patch("/documents/{document_id}", response_model=NitiragDocumentRecord)
async def update_gazette_document(document_id: str, req: UpdateDocumentRequest):
    updated = await vector_db_service.update_document(document_id, req.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Document not found.")
    return updated


@router.delete("/documents/{document_id}")
async def delete_gazette_document(document_id: str):
    success = await vector_db_service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document from database.")
    return {"success": True, "message": f"Document {document_id} and its vector embeddings deleted successfully."}


# ----------------------------------------------------
# 3. CHAT CONVERSATION SESSIONS (ChatGPT-Style CRUD & Archiving)
# ----------------------------------------------------

@router.get("/conversations", response_model=List[NitiragConversationRecord])
async def list_conversations(user_id: Optional[str] = Query(None)):
    return await vector_db_service.get_conversations(user_id=user_id)


@router.post("/conversations", response_model=NitiragConversationRecord)
async def create_conversation(req: CreateConversationRequest):
    conv_id = f"niti-chat-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Get document titles for display tags
    doc_titles = []
    if req.selected_document_ids:
        for d_id in req.selected_document_ids:
            doc = await vector_db_service.get_document_by_id(d_id)
            if doc:
                doc_titles.append(doc.title)

    initial_message = ChatMessageRecord(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="assistant",
        text="Namaste. I am your GramSetu Niti RAG Statutory Legal Advisor. "
             + (f"I am actively scoped to consult against **{len(doc_titles)} selected gazette documents**." if doc_titles else "I have access to the full National Statutory Gazette repository.")
             + " You can ask questions regarding agricultural welfare gazettes, PMKSY drip criteria, PM-KUSUM solar rules, or land mutation procedures.",
        citations=[],
        created_at=now_iso,
    )

    conv_record = NitiragConversationRecord(
        id=conv_id,
        session_id=conv_id,
        title=req.title or "New Legal Consultation",
        user_id=req.user_id or "citizen",
        selected_document_ids=req.selected_document_ids,
        selected_document_titles=doc_titles,
        messages=[initial_message],
        is_archived=False,
        enable_web_search=req.enable_web_search,
        created_at=now_iso,
        updated_at=now_iso,
    )

    await vector_db_service.create_conversation(conv_record)
    return conv_record


@router.get("/conversations/{conversation_id}", response_model=NitiragConversationRecord)
async def get_conversation(conversation_id: str):
    conv = await vector_db_service.get_conversation_by_id(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return conv


@router.patch("/conversations/{conversation_id}", response_model=NitiragConversationRecord)
async def update_conversation(conversation_id: str, req: UpdateConversationRequest):
    updates = req.model_dump(exclude_unset=True)
    if "selected_document_ids" in updates and updates["selected_document_ids"] is not None:
        doc_titles = []
        for d_id in updates["selected_document_ids"]:
            doc = await vector_db_service.get_document_by_id(d_id)
            if doc:
                doc_titles.append(doc.title)
        updates["selected_document_titles"] = doc_titles

    updated = await vector_db_service.update_conversation(conversation_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return updated


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    success = await vector_db_service.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete conversation.")
    return {"success": True, "message": "Conversation session removed."}


@router.post("/conversations/summarize-fork", response_model=NitiragConversationRecord)
async def summarize_and_fork_conversation(req: SummarizeAndForkRequest):
    """
    Summarizes an existing conversation approaching its context limit, archives the old session,
    and returns a fresh conversation seeded with the concise statutory summary.
    """
    conv = await vector_db_service.get_conversation_by_id(req.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")

    # Generate summary with Groq
    conversation_transcript = "\n".join([f"{m.role.upper()}: {m.text}" for m in conv.messages])
    summary_prompt = (
        "Summarize the key statutory findings, citizen profile context, and legal guidance discussed in this dialogue. "
        "Create a concise 2-3 paragraph statutory briefing that can seed a new legal advisory consultation:\n\n"
        f"{conversation_transcript}"
    )

    summary_text = "Statutory Consultation Executive Summary of past legal inquiries."
    active_keys = groq_pool.get_all_keys()
    for key in active_keys:
        try:
            client = Groq(api_key=key, timeout=10.0)
            resp = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=600,
            )
            summary_text = resp.choices[0].message.content or summary_text
            break
        except Exception as e:
            logger.warning(f"Summarization Groq warning: {e}")

    # Mark old conversation as archived
    await vector_db_service.update_conversation(req.conversation_id, {"is_archived": True})

    # Create new forked conversation
    now_iso = datetime.now(timezone.utc).isoformat()
    new_conv_id = f"niti-chat-{uuid.uuid4().hex[:12]}"

    forked_initial_message = ChatMessageRecord(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="assistant",
        text=(
            f"### Statutory Consultation Resumed (Context Reset)\n\n"
            f"This new consultation session has been seeded with key legal context from your previous archived consultation **\"{conv.title}\"**:\n\n"
            f"> {summary_text}\n\n"
            f"**Your statutory scope remains active.** What further gazette provisions or procedures would you like to explore?"
        ),
        citations=[],
        created_at=now_iso,
    )

    new_conv = NitiragConversationRecord(
        id=new_conv_id,
        session_id=new_conv_id,
        title=f"Continued: {conv.title[:25]}",
        user_id=req.user_id or conv.user_id,
        selected_document_ids=conv.selected_document_ids,
        selected_document_titles=conv.selected_document_titles,
        messages=[forked_initial_message],
        is_archived=False,
        enable_web_search=conv.enable_web_search,
        created_at=now_iso,
        updated_at=now_iso,
    )

    await vector_db_service.create_conversation(new_conv)
    return new_conv


# ----------------------------------------------------
# 4. CHAT TURN EXECUTION (LANGGRAPH AGENT ORCHESTRATED)
# ----------------------------------------------------

@router.post("/chat", response_model=NitiragConversationRecord)
async def execute_chat_turn(req: NitiragChatTurnRequest):
    now_iso = datetime.now(timezone.utc).isoformat()
    query_text = req.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # 1. Retrieve or Create Conversation Session
    conv_id = req.conversation_id
    conv = None
    if conv_id:
        conv = await vector_db_service.get_conversation_by_id(conv_id)

    if not conv:
        conv_id = conv_id or f"niti-chat-{uuid.uuid4().hex[:12]}"
        doc_titles = []
        for d_id in req.selected_document_ids:
            doc = await vector_db_service.get_document_by_id(d_id)
            if doc:
                doc_titles.append(doc.title)

        conv = NitiragConversationRecord(
            id=conv_id,
            session_id=conv_id,
            title=query_text[:35] + ("..." if len(query_text) > 35 else ""),
            user_id=req.user_id or "citizen",
            selected_document_ids=req.selected_document_ids,
            selected_document_titles=doc_titles,
            messages=[],
            is_archived=False,
            enable_web_search=req.enable_web_search,
            created_at=now_iso,
            updated_at=now_iso,
        )
        await vector_db_service.create_conversation(conv)

    # 2. Append User Message to DB
    user_msg = ChatMessageRecord(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="user",
        text=query_text,
        citations=[],
        created_at=now_iso,
    )
    await vector_db_service.append_message_to_conversation(conv_id, user_msg)

    # 3. Execute LangGraph Workflow
    history_dicts = [m.model_dump() for m in conv.messages]
    initial_graph_state = {
        "conversation_id": conv_id,
        "query": query_text,
        "user_id": req.user_id or conv.user_id,
        "state_scope": req.state,
        "selected_document_ids": req.selected_document_ids or conv.selected_document_ids or [],
        "enable_web_search": req.enable_web_search or conv.enable_web_search,
        "language": req.language,
        "messages_history": history_dicts,
        "total_turns": len(history_dicts),
        "context_tokens_estimate": 0,
        "needs_summarization_prompt": False,
        "vector_chunks": [],
        "web_sources": [],
        "answer": "",
        "citations": [],
        "confidence_score": 0.95,
    }

    logger.info(f"[LangGraph Engine] Invoking Niti RAG Agent Graph for session {conv_id}...")
    final_state = await nitirag_langgraph_app.ainvoke(initial_graph_state)

    # 4. Map Citations to Pydantic Models
    parsed_citations: List[NitiragCitation] = []
    for c in final_state.get("citations", []):
        parsed_citations.append(
            NitiragCitation(
                document_id=c.get("document_id", "doc-default"),
                document_title=c.get("document_title", "Official Gazette"),
                gazette_number=c.get("gazette_number"),
                page_number=c.get("page_number", 1),
                chunk_text=c.get("chunk_text", ""),
                pdf_url=c.get("pdf_url", ""),
                relevance_score=c.get("relevance_score", 0.9),
                source_type=c.get("source_type", "vector_gazette"),
                domain=c.get("domain", "gov.in"),
                favicon_url=c.get("favicon_url", "https://www.google.com/s2/favicons?domain=gov.in&sz=64"),
            )
        )

    # 5. Append Assistant Message
    assistant_msg = ChatMessageRecord(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        role="assistant",
        text=final_state.get("answer", "Statutory advisory guidance processed."),
        citations=parsed_citations,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    updated_conv = await vector_db_service.append_message_to_conversation(conv_id, assistant_msg)

    # Auto-update conversation title if it was first message
    if conv.title == "New Legal Consultation":
        auto_title = query_text[:35] + ("..." if len(query_text) > 35 else "")
        await vector_db_service.update_conversation(conv_id, {"title": auto_title})
        if updated_conv:
            updated_conv.title = auto_title

    return updated_conv or conv


# ----------------------------------------------------
# 5. ONE-OFF QUERY ENDPOINT
# ----------------------------------------------------

@router.post("/query", response_model=NitiragQueryResponse)
async def query_niti_rag(req: NitiragQueryRequest):
    start_time = time.time()
    query_text = req.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Use LangGraph for single turn query
    initial_graph_state = {
        "conversation_id": "one-off-query",
        "query": query_text,
        "user_id": "citizen",
        "state_scope": req.state,
        "selected_document_ids": req.selected_document_ids or [],
        "enable_web_search": req.enable_web_search,
        "language": req.language,
        "messages_history": [],
        "total_turns": 0,
        "context_tokens_estimate": 0,
        "needs_summarization_prompt": False,
        "vector_chunks": [],
        "web_sources": [],
        "answer": "",
        "citations": [],
        "confidence_score": 0.95,
    }

    final_state = await nitirag_langgraph_app.ainvoke(initial_graph_state)
    parsed_citations = [NitiragCitation(**c) for c in final_state.get("citations", [])]

    exec_time = round((time.time() - start_time) * 1000, 2)
    return NitiragQueryResponse(
        query=query_text,
        answer=final_state.get("answer", ""),
        citations=parsed_citations,
        confidence_score=final_state.get("confidence_score", 0.95),
        model_used="LangGraph-Orchestrated-Groq-Gemini",
        execution_time_ms=exec_time,
    )
