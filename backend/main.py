# backend/main.py
import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import traceback
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import database initialization functions
from app.db.init_db import init_db, close_db_connections

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for the FastAPI app
    Handles startup and shutdown events
    """
    # Startup: Initialize databases
    logger.info("Starting up application...")
    try:
        await init_db()
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.error(traceback.format_exc())
        # We don't re-raise the exception because we want the application to start
        # even if database initialization fails. The endpoints will handle the errors.
    
    yield
    
    # Shutdown: Close database connections
    logger.info("Shutting down application...")
    try:
        await close_db_connections()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")
        logger.error(traceback.format_exc())


def create_main_application() -> FastAPI:
    """Create the main application with api endpoints."""
    from app.core.settings import get_settings
    settings = get_settings()
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    
    # Set up CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add global exception handler for database errors
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    
    # Import and include API router
    from app.api.router import api_router
    app.include_router(api_router)
    
    # Add health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy"}
    
    return app


# Create the main application
app = create_main_application()


if __name__ == "__main__":
    # Check for SSL certificates in the certificates directory
    cert_dir = Path(__file__).parent / "certificates"
    cert_file = cert_dir / "localhost.pem"
    key_file = cert_dir / "localhost-key.pem"

    if cert_file.exists() and key_file.exists():
        logger.info(f"SSL certificates found in {cert_dir}, starting HTTPS server")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            ssl_certfile=str(cert_file),
            ssl_keyfile=str(key_file),
        )
    else:
        logger.info("No SSL certificates found, starting HTTP server")
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)