import os
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "GramSetu AI Backend"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    DATABASE_URL: Optional[str] = None

    # MongoDB Atlas Configuration
    MONGO_DB_URI: Optional[str] = "mongodb+srv://u00573684_db_user:u00573684_db_user@c1.ddrjz7l.mongodb.net/"
    MONGO_DB_NAME: str = "gramsetu_production"

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = "gramsetu_krishi_civic_auth_secret_key_8492049284092834092384"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days

    # SMTP Email Configuration
    EMAIL: Optional[str] = "easynetcraft@gmail.com"
    APP_PASSWORD: Optional[str] = "wkzcpziaujpelmws"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465  # SSL

    # Realtime Search & Extraction (Groq + Tavily + Trafilatura)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    TAVILY_API_KEY: Optional[str] = None
    TAVILY_SEARCH_DEPTH: str = "advanced"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
