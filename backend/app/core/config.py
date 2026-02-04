from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application Settings
    
    Sensitive values (credentials, secrets, private URLs) are loaded from .env file.
    Non-sensitive defaults are defined here.
    """
    
    # ============================================
    # NON-SENSITIVE CONFIGURATION (Public Defaults)
    # ============================================
    
    # API Metadata
    PROJECT_NAME: str = "FastAPI + Ollama API"
    API_V1_STR: str = "/api/v1"
    
    # JWT Configuration (non-sensitive defaults)
    ALGORITHM: str = "HS256"  # JWT algorithm (public knowledge)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Ollama Model Selection (non-sensitive default)
    OLLAMA_MODEL: str = "llama3:8b"
    
    # Google OAuth Redirect (constructed from environment)
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    # ============================================
    # SENSITIVE CONFIGURATION (Must be in .env)
    # ============================================
    
    # PostgreSQL Database Credentials (no defaults - must be in .env)
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # MongoDB Connection (no defaults - must be in .env)
    MONGODB_URL: str
    MONGODB_DB: str
    
    # Ollama API Server (no default - must be in .env)
    OLLAMA_HOST: str
    
    # CORS Origin (no default - must be in .env)
    FRONTEND_ORIGIN: str
    
    # JWT Secret Key (no default - must be in .env)
    SECRET_KEY: str
    
    # Google OAuth Credentials (no defaults - must be in .env)
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
