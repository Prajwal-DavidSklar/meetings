# backend/main.py
import uvicorn
import logging
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

from app.db.init_db import init_db, close_db_connections


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    try:
        await init_db()
        logger.info("Database initialisation completed successfully")
    except Exception as e:
        logger.error("Database initialisation failed: %s", e)
        logger.error(traceback.format_exc())

    yield

    logger.info("Shutting down application...")
    try:
        await close_db_connections()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error("Error closing database connections: %s", e)


def create_main_application() -> FastAPI:
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

    # CORS — tighten origins in production via settings.FRONTEND_URL
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception: %s", exc)
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )

    # API routes
    from app.api.router import api_router
    app.include_router(api_router)

    # Serve uploaded images at /uploads/…
    uploads_dir = settings.UPLOADS_DIR
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    # Health check
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_main_application()


if __name__ == "__main__":
    cert_dir = Path(__file__).parent / "certificates"
    cert_file = cert_dir / "localhost.pem"
    key_file = cert_dir / "localhost-key.pem"

    if cert_file.exists() and key_file.exists():
        logger.info("SSL certificates found — starting HTTPS server")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            ssl_certfile=str(cert_file),
            ssl_keyfile=str(key_file),
        )
    else:
        logger.info("No SSL certificates found — starting HTTP server")
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
