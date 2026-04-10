from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.settings import get_settings

settings = get_settings()

# Create SQLite engine
# check_same_thread=False is needed for SQLite to work with FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    Yields a session and closes it after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
