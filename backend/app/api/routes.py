from fastapi import APIRouter
from app.api.endpoints import ai, texts, auth, sessions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(texts.router, prefix="/texts", tags=["texts"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
