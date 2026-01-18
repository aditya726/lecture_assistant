from fastapi import APIRouter
from app.api.endpoints import students, ai, texts

api_router = APIRouter()

api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(texts.router, prefix="/texts", tags=["texts"])
