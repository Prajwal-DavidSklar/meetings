from pydantic_settings import BaseSettings
from pathlib import Path
from functools import lru_cache


# Resolve the backend root directory (three levels up from this file)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Project metadata
    PROJECT_NAME: str = "Meetings Portal API"
    PROJECT_DESCRIPTION: str = "Internal portal for managing HubSpot meeting booking links"
    API_V1_STR: str = "/api/v1"

    # SQLite Database
    DATABASE_PATH: Path = BACKEND_DIR / "db" / "meetings.db"
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'db' / 'meetings.db'}"

    # JWT Security
    SECRET_KEY: str = "change-this-to-a-long-random-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60          # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7             # 7 days

    # HubSpot
    HUBSPOT_ACCESS_TOKEN: str = ""
    HUBSPOT_CLIENT_SECRET: str = ""
    HUBSPOT_API_BASE: str = "https://api.hubapi.com"

    # Microsoft Azure AD (tenant-restricted OAuth)
    APPLICATION_ID: str = ""       # Azure App Registration Client ID
    OBJECT_ID: str = ""            # Service Principal Object ID
    DIRECTORY_ID: str = ""         # Azure Tenant ID
    CLIENT_SECRET: str = ""        # Azure App Client Secret
    CLIENT_SECRET_ID: str = ""     # Client Secret ID (for reference)
    REDIRECT_URI: str = "http://localhost:3000/auth/callback"

    # Frontend URL — used for CORS and post-auth redirects
    FRONTEND_URL: str = "http://localhost:3000"

    # File uploads directory (relative to backend root)
    UPLOADS_DIR: Path = BACKEND_DIR / "uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
