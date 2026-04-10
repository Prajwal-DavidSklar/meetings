from fastapi import APIRouter
from app.core.settings import get_settings

settings = get_settings()

api_router = APIRouter(prefix=settings.API_V1_STR)

# Health / smoke-test (kept from initial setup)
from app.api.endpoints.test import router as test_router
api_router.include_router(test_router, prefix="/test", tags=["test"])

# Auth
from app.api.endpoints.auth import router as auth_router
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])

# Users (admin)
from app.api.endpoints.users import router as users_router
api_router.include_router(users_router, prefix="/users", tags=["users"])

# Categories (admin manages, everyone reads)
from app.api.endpoints.categories import router as categories_router
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])

# Meeting hosts (admin manages, everyone reads)
from app.api.endpoints.hosts import router as hosts_router
api_router.include_router(hosts_router, prefix="/hosts", tags=["hosts"])

# Meeting links + sync
from app.api.endpoints.meetings import router as meetings_router
api_router.include_router(meetings_router, prefix="/meetings", tags=["meetings"])
