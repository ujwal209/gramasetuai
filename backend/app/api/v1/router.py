from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.eligibility import router as eligibility_router
from app.api.v1.realtime_search import router as realtime_search_router
from app.api.v1.kagazcheck import router as kagazcheck_router
from app.api.v1.vanibot import router as vanibot_router
from app.api.v1.vani import router as vani_router
from app.api.v1.parchaa import router as parchaa_router
from app.api.v1.nitirag import router as nitirag_router
from app.api.v1.chaupal import router as chaupal_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(eligibility_router)
api_router.include_router(realtime_search_router)
api_router.include_router(kagazcheck_router)
api_router.include_router(vanibot_router)
api_router.include_router(vani_router)
api_router.include_router(parchaa_router)
api_router.include_router(nitirag_router)
api_router.include_router(chaupal_router, prefix="/chaupal", tags=["Kisan Chaupal Social & Marketplace"])
