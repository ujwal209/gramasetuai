import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, status
from app.schemas.kagazcheck import (
    KagazCheckAnalyzeResponse,
    DocumentTypeSpecification,
    SchemeReadinessAudit,
    BatchAuditRequest,
)
from app.services.kagazcheck.document_service import document_service
from app.services.kagazcheck.groq_tavily_auditor import kagaz_auditor_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kagazcheck", tags=["KagazCheck - Vision Document Auditor"])


@router.get(
    "/document-types",
    response_model=List[DocumentTypeSpecification],
    summary="List Supported Government Document Types",
    description="Returns the statutory specification and required fields for all supported Indian documents.",
)
async def get_document_types():
    return document_service.get_supported_document_types()


@router.post(
    "/analyze-batch",
    summary="Multi-Document Batch Analysis, Cloudinary Upload & Groq Cross-Matching",
    description="Accepts multiple documents at once, uploads to Cloudinary, runs Groq Llama 3.3 cross-reconciliation and Tavily statutory verification, and saves the audit report to MongoDB Atlas.",
)
async def analyze_batch_documents(
    files: List[UploadFile] = File(..., description="Multiple document images or PDFs"),
    scheme_id: Optional[str] = Form(None, description="Target scheme ID to audit readiness against"),
    scheme_name: Optional[str] = Form(None, description="Target scheme display name"),
    citizen_profile: Optional[str] = Form(None, description="Optional citizen profile JSON"),
    user_id: Optional[str] = Form("citizen", description="Citizen ID / user handle for audit history"),
):
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document file must be uploaded.",
        )

    file_tuples = []
    for f in files:
        contents = await f.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{f.filename}' exceeds maximum allowed limit of 15MB.",
            )
        if len(contents) == 0:
            continue
        file_tuples.append((f.filename or "uploaded_document", contents, f.content_type or "image/jpeg"))

    if len(file_tuples) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded files are empty.",
        )

    profile_dict = None
    if citizen_profile:
        try:
            profile_dict = json.loads(citizen_profile)
        except Exception as e:
            logger.warning(f"Could not parse citizen_profile JSON in KagazCheck: {e}")

    try:
        report = await kagaz_auditor_service.analyze_batch_documents(
            files=file_tuples,
            scheme_id=scheme_id,
            scheme_name=scheme_name,
            citizen_profile=profile_dict,
            user_id=user_id or "citizen",
        )
        return report
    except Exception as e:
        logger.error(f"Multi-document batch audit failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document audit processing failed: {str(e)}",
        )


@router.post(
    "/analyze",
    response_model=KagazCheckAnalyzeResponse,
    summary="Analyze Single Uploaded Document",
    description="Performs OCR extraction, deterministic field validation, and single document check.",
)
async def analyze_document(
    file: UploadFile = File(..., description="Document image or PDF captured from camera or file upload"),
    scheme_id: Optional[str] = Form(None, description="Optional government scheme ID"),
    citizen_profile: Optional[str] = Form(None, description="Optional citizen profile JSON string"),
):
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 15MB.",
        )
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    profile_dict = None
    if citizen_profile:
        try:
            profile_dict = json.loads(citizen_profile)
        except Exception as e:
            logger.warning(f"Could not parse citizen_profile JSON in KagazCheck: {e}")

    try:
        result = document_service.analyze_document(
            file_bytes=contents,
            file_name=file.filename or "uploaded_document",
            mime_type=file.content_type or "application/octet-stream",
            citizen_profile=profile_dict,
            scheme_id=scheme_id,
        )
        return result
    except Exception as e:
        logger.error(f"Error analyzing document in KagazCheck: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document analysis failed: {str(e)}",
        )


@router.get(
    "/history",
    summary="Get KagazCheck Audit History from MongoDB Atlas",
    description="Retrieves past multi-document audits with Cloudinary preview URLs, cross-match scores, and readiness reports.",
)
async def get_audit_history(
    user_id: Optional[str] = Query(None, description="Filter by citizen handle"),
    limit: int = Query(20, ge=1, le=50),
):
    audits = await kagaz_auditor_service.get_audit_history(user_id=user_id, limit=limit)
    return {
        "success": True,
        "count": len(audits),
        "history": audits,
    }


@router.get(
    "/history/{audit_id}",
    summary="Get Specific KagazCheck Audit Report by ID",
)
async def get_audit_by_id(audit_id: str):
    record = await kagaz_auditor_service.get_audit_by_id(audit_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit report '{audit_id}' not found.",
        )
    return record


@router.delete(
    "/history/{audit_id}",
    summary="Delete Specific KagazCheck Audit Record",
)
async def delete_audit_by_id(audit_id: str):
    success = await kagaz_auditor_service.delete_audit_by_id(audit_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit report '{audit_id}' not found or already deleted.",
        )
    return {"success": True, "message": f"Deleted audit report '{audit_id}'."}


@router.delete(
    "/history",
    summary="Clear All KagazCheck Audit History",
)
async def clear_audit_history(
    user_id: Optional[str] = Query(None, description="Citizen handle to clear"),
):
    await kagaz_auditor_service.clear_audit_history(user_id=user_id)
    return {"success": True, "message": "Cleared all document audit history."}


@router.post(
    "/audit",
    response_model=SchemeReadinessAudit,
    summary="Evaluate Overall Scheme Document Readiness",
)
async def audit_scheme_readiness(req: BatchAuditRequest):
    try:
        return document_service.audit_batch(
            scheme_id=req.scheme_id,
            document_ids=req.document_ids,
        )
    except Exception as e:
        logger.error(f"Error auditing scheme readiness: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheme audit failed: {str(e)}",
        )


@router.post(
    "/session/clear",
    summary="Clear KagazCheck In-Memory Session Cache",
)
async def clear_session():
    document_service.clear_session_documents()
    return {"status": "success", "message": "KagazCheck session cache cleared."}
