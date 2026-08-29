from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NitiragChunkRecord(BaseModel):
    id: str
    document_id: str
    document_title: str
    state: str
    department: str
    page_number: int
    chunk_index: int
    text: str
    embedding: Optional[List[float]] = None
    embedding_model: str = "models/gemini-embedding-001"
    created_at: str


class NitiragDocumentRecord(BaseModel):
    id: str
    title: str
    state: str = "All India"
    department: str = "Agriculture & Farmers Welfare"
    category: str = "Statutory Welfare & Subsidies"
    gazette_number: Optional[str] = None
    pdf_url: str
    file_name: str
    file_size_bytes: int = 0
    total_pages: int = 1
    total_chunks: int = 0
    embedding_model_used: str = "models/gemini-embedding-001"
    status: str = "INDEXED"
    uploaded_by: str = "citizen"
    created_at: str
    summary: Optional[str] = None


class UpdateDocumentRequest(BaseModel):
    title: Optional[str] = None
    state: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    gazette_number: Optional[str] = None


class UploadGazetteResponse(BaseModel):
    success: bool
    message: str
    document: NitiragDocumentRecord
    chunks_created: int
    embedding_model: str


class NitiragDocumentListResponse(BaseModel):
    total: int
    documents: List[NitiragDocumentRecord]


class NitiragModelInfo(BaseModel):
    active_models: List[str]
    total_gemini_keys: int
    current_key_preview: Optional[str] = None
    status: str = "HEALTHY"


class NitiragCitation(BaseModel):
    document_id: str
    document_title: str
    gazette_number: Optional[str] = None
    page_number: int = 1
    chunk_text: str
    pdf_url: str
    relevance_score: float
    source_type: str = "vector_gazette"  # "vector_gazette" | "web_search"
    domain: Optional[str] = "gov.in"
    favicon_url: Optional[str] = "https://www.google.com/s2/favicons?domain=gov.in&sz=64"


class ChatMessageRecord(BaseModel):
    id: str
    role: str  # "user" | "assistant"
    text: str
    citations: List[NitiragCitation] = Field(default_factory=list)
    created_at: str


class NitiragConversationRecord(BaseModel):
    id: str
    session_id: str
    title: str
    user_id: str = "citizen"
    selected_document_ids: List[str] = Field(default_factory=list)
    selected_document_titles: List[str] = Field(default_factory=list)
    messages: List[ChatMessageRecord] = Field(default_factory=list)
    is_archived: bool = False
    enable_web_search: bool = False
    created_at: str
    updated_at: str


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Legal Consultation"
    selected_document_ids: List[str] = Field(default_factory=list)
    enable_web_search: bool = False
    user_id: Optional[str] = None


class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    selected_document_ids: Optional[List[str]] = None
    is_archived: Optional[bool] = None
    enable_web_search: Optional[bool] = None


class NitiragChatTurnRequest(BaseModel):
    conversation_id: Optional[str] = None
    query: str
    selected_document_ids: List[str] = Field(default_factory=list)
    enable_web_search: bool = False
    language: str = "en"
    state: Optional[str] = None
    user_id: Optional[str] = None


class SummarizeAndForkRequest(BaseModel):
    conversation_id: str
    user_id: Optional[str] = None


class NitiragQueryRequest(BaseModel):
    query: str
    state: Optional[str] = None
    department: Optional[str] = None
    selected_document_ids: Optional[List[str]] = None
    enable_web_search: bool = False
    top_k: int = 4
    language: str = "en"
    citizen_profile: Optional[Dict[str, Any]] = None


class NitiragQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[NitiragCitation] = Field(default_factory=list)
    confidence_score: float = 0.95
    model_used: str = "models/gemini-embedding-001"
    execution_time_ms: float = 0.0
