from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core.config import settings
from app.db.mongodb import verify_connection
from app.services.embedding import load_embedding_model
from app.services.faiss_index import build_faiss_index

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware (explicit origins required when credentials=True)
allowed_origins = [
    getattr(settings, "FRONTEND_ORIGIN", "http://localhost:5173"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Verify database connections and load AI models on startup"""
    verify_connection()
    # Load embedding model
    load_embedding_model()
    # Build FAISS vector DB
    build_faiss_index()

@app.get("/")
def read_root():
    return {"message": "Welcome to the API"}
