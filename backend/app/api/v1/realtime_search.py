from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel, Field
from app.services.realtime_search_service import realtime_search_service
from app.data.verified_schemes import VERIFIED_SCHEMES_SEED

router = APIRouter(prefix="/schemes", tags=["Realtime Scheme Search & Verification"])


class RealtimeSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Scheme name, keyword, or beneficiary inquiry")
    state: Optional[str] = Field(None, description="Optional State filter (e.g., Karnataka, UP)")
    language: Optional[str] = Field("en", description="Language preference (en, hi, kn)")
    max_results: Optional[int] = Field(5, ge=1, le=10)
    user_id: Optional[str] = Field("citizen", description="Citizen ID / user handle for search history")


class SourceCitation(BaseModel):
    title: str
    url: str
    domain: str
    favicon_url: str
    snippet: str


class AIOverviewData(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    key_takeaways: Optional[List[str]] = []
    primary_qualification: Optional[str] = None
    recommended_action: Optional[str] = None


class RealtimeSearchResponse(BaseModel):
    id: Optional[str] = None
    query: str
    state: Optional[str] = None
    language: Optional[str] = "en"
    count: Optional[int] = None
    ai_overview: Optional[Dict[str, Any]] = None
    schemes: List[Dict[str, Any]]
    sources: List[SourceCitation]
    execution_time_ms: float
    engine: str


@router.post(
    "/search-realtime",
    response_model=RealtimeSearchResponse,
    summary="Search & Verify Schemes in Real-Time (Groq + Tavily + Trafilatura)",
    description="Performs real-time web discovery across official government portals and extracts verified scheme parameters with favicon citations and saves search history in MongoDB.",
)
async def search_schemes_realtime(req: RealtimeSearchRequest):
    try:
        result = await realtime_search_service.search_schemes(
            query=req.query,
            state=req.state,
            language=req.language or "en",
            max_results=req.max_results or 5,
        )

        # Save to MongoDB search history
        user_id = req.user_id or "citizen"
        history_id = await realtime_search_service.save_search_history(
            user_id=user_id,
            query=req.query,
            state=req.state,
            language=req.language or "en",
            ai_overview=result.get("ai_overview", {}),
            schemes=result.get("schemes", []),
            sources=result.get("sources", []),
            execution_time_ms=result.get("execution_time_ms", 0.0),
        )

        result["id"] = history_id
        result["count"] = len(result.get("schemes", []))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Realtime scheme search failed: {str(e)}",
        )


@router.get(
    "/search-live",
    response_model=RealtimeSearchResponse,
    summary="Quick Live Search Schemes with Favicons",
)
async def search_schemes_live(
    q: str = Query(..., min_length=1, description="Search query"),
    state: Optional[str] = Query(None, description="State filter"),
    lang: str = Query("en", description="Language code"),
    user_id: Optional[str] = Query("citizen", description="User ID"),
):
    try:
        result = await realtime_search_service.search_schemes(
            query=q,
            state=state,
            language=lang,
            max_results=5,
        )
        history_id = await realtime_search_service.save_search_history(
            user_id=user_id or "citizen",
            query=q,
            state=state,
            language=lang,
            ai_overview=result.get("ai_overview", {}),
            schemes=result.get("schemes", []),
            sources=result.get("sources", []),
            execution_time_ms=result.get("execution_time_ms", 0.0),
        )
        result["id"] = history_id
        result["count"] = len(result.get("schemes", []))
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Live search failed: {str(e)}",
        )


@router.get(
    "/history",
    summary="Get Citizen Scheme Search History",
    description="Returns recent verified search queries and synthesized scheme summaries saved in MongoDB.",
)
async def get_scheme_search_history(
    user_id: Optional[str] = Query(None, description="Citizen user ID or handle"),
    limit: int = Query(30, ge=1, le=100, description="Max history records to return"),
):
    try:
        records = await realtime_search_service.get_search_history(user_id=user_id, limit=limit)
        return {
            "success": True,
            "count": len(records),
            "history": records,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve search history: {str(e)}",
        )


@router.get(
    "/history/{history_id}",
    summary="Get Specific Scheme Search Record",
)
async def get_scheme_search_history_item(history_id: str):
    record = await realtime_search_service.get_search_history_by_id(history_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Search history '{history_id}' not found.",
        )
    return record


@router.delete(
    "/history/{history_id}",
    summary="Delete a Specific Search History Record",
)
async def delete_scheme_search_history_item(history_id: str):
    success = await realtime_search_service.delete_search_history_item(history_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Search history '{history_id}' not found or already deleted.",
        )
    return {"success": True, "message": f"Deleted search history '{history_id}'"}


@router.delete(
    "/history",
    summary="Clear All Scheme Search History",
)
async def clear_scheme_search_history(
    user_id: Optional[str] = Query(None, description="Citizen user ID to clear"),
):
    await realtime_search_service.clear_search_history(user_id=user_id)
    return {"success": True, "message": "Cleared scheme search history."}


@router.get(
    "/popular",
    summary="Get Popular Government Schemes",
    description="Returns verified popular government schemes directory.",
)
async def get_popular_schemes():
    return VERIFIED_SCHEMES_SEED


@router.get(
    "",
    summary="List All Verified Schemes",
    description="Returns all verified statutory schemes.",
)
async def get_all_schemes():
    return VERIFIED_SCHEMES_SEED


@router.get(
    "/{scheme_id}",
    summary="Get Detailed Scheme by ID",
    description="Returns full statutory parameters, rules, and required documents for a scheme.",
)
async def get_scheme_by_id(scheme_id: str):
    for s in VERIFIED_SCHEMES_SEED:
        if s.get("id") == scheme_id or s.get("id", "").lower() == scheme_id.lower():
            return s
    raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")


