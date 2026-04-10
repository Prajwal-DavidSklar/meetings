from fastapi import APIRouter
from app.core.settings import get_settings

settings = get_settings()

# Create the main API router
api_router = APIRouter(prefix=settings.API_V1_STR)

# Import and include routers from endpoints
from app.api.endpoints.test import router as test_router

# Include routers
api_router.include_router(test_router, prefix="/test", tags=["test"])

# Add more routers as the application grows
# api_router.include_router(inspection_router, prefix="/inspections", tags=["inspections"])
# api_router.include_router(recommendation_router, prefix="/recommendations", tags=["recommendations"])