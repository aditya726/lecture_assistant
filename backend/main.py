from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core.config import settings
from app.db.mongodb import verify_connection

app = FastAPI(title=settings.PROJECT_NAME)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Verify database connections on startup"""
    verify_connection()

@app.get("/")
def read_root():
    return {"message": "Welcome to the API"}
