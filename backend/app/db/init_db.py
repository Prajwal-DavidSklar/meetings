import logging
from sqlalchemy import inspect, text
from app.db.database import engine, Base
from app.core.settings import settings

logger = logging.getLogger(__name__)


def _apply_migrations() -> None:
    inspector = inspect(engine)
    try:
        cols = {c["name"] for c in inspector.get_columns("meeting_links")}
        if "notes" not in cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE meeting_links ADD COLUMN notes TEXT"))
                conn.commit()
            logger.info("Migration: added 'notes' column to meeting_links")
    except Exception as e:
        logger.warning("Migration check failed: %s", e)


async def init_db() -> None:
    """
    Create the DB file + all tables, and ensure the uploads directory exists.
    Called once at application startup.
    """
    # Ensure the SQLite database directory exists
    db_dir = settings.DATABASE_PATH.parent
    db_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Database path: %s", settings.DATABASE_PATH)

    # Import all models so SQLAlchemy registers them before create_all
    import app.models.user          # noqa: F401
    import app.models.category      # noqa: F401
    import app.models.meeting_host  # noqa: F401
    import app.models.meeting_link  # noqa: F401
    import app.models.sync_log      # noqa: F401

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified successfully")
    _apply_migrations()

    # Ensure the uploads directory and sub-directories exist
    uploads_dir = settings.UPLOADS_DIR
    (uploads_dir / "meeting_images").mkdir(parents=True, exist_ok=True)
    logger.info("Uploads directory ready: %s", uploads_dir)


async def close_db_connections() -> None:
    engine.dispose()
    logger.info("Database connections closed")
