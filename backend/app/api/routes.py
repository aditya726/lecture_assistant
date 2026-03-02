from fastapi import APIRouter
from app.api.endpoints import ai, texts, auth, sessions, recommendations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(texts.router, prefix="/texts", tags=["texts"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
