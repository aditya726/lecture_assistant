from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI + Ollama API"
    API_V1_STR: str = "/api/v1"
    
    # PostgreSQL
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB: str
    
    # Ollama
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
