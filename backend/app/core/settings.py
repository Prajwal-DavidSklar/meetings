from pydantic_settings import BaseSettings
from pathlib import Path
import os
from functools import lru_cache


# Get the backend directory path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Project metadata
    PROJECT_NAME: str = "Meetings Scheduler API"
    PROJECT_DESCRIPTION: str = "API for Meetings view/scheduling/canceling powered by HubSpot Meeting Scheduler"
    API_V1_STR: str = "/api/v1"

    # SQLite Database configuration
    DATABASE_PATH: Path = BACKEND_DIR / "db" / "meetings.db"
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'db' / 'meetings.db'}"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "thisisasupersecretkeywhichwillbeupdatedinproduction")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get the application settings.
    Uses lru_cache to avoid loading .env file for each request
    """
    return Settings()