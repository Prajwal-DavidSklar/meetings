import logging
from pathlib import Path
from app.db.database import engine, Base
from app.core.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def init_db() -> None:
    """
    Initialize the database.
    Creates the database file and all tables if they don't exist.
    """
    # Ensure the db directory exists
    db_dir = settings.DATABASE_PATH.parent
    db_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Database path: {settings.DATABASE_PATH}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")


async def close_db_connections() -> None:
    """
    Close database connections.
    For SQLite, this disposes the engine connection pool.
    """
    engine.dispose()
    logger.info("Database connections closed")
