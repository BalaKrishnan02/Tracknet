import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "TraffiTrace AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "sih2026_traffitrace_ai_super_secret_jwt_key_for_hackathon"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./traffitrace.db"
    
    # Modes
    DEMO_MODE: bool = True
    SIMULATION_INTERVAL_SECONDS: int = 4
    REAL_AI_ENABLED: bool = False
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
