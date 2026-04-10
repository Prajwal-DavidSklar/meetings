from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db

router = APIRouter()


@router.get("/")
async def test_endpoint():
    """Simple test endpoint to verify the API is working."""
    return {"message": "API is working!", "status": "ok"}


@router.get("/db")
async def test_database(db: Session = Depends(get_db)):
    """Test endpoint to verify database connectivity."""
    try:
        # Execute a simple query to test the connection
        db.execute(text("SELECT 1"))
        return {"message": "Database connection successful", "status": "ok"}
    except Exception as e:
        return {"message": f"Database connection failed: {str(e)}", "status": "error"}
