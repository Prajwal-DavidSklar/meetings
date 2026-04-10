"""
Authentication endpoints.

Supports two login paths:
  1. Manual (email + password)  — for dev/admin accounts
  2. Microsoft OAuth 2.0         — tenant-restricted, for internal users

Both paths return the same JWT token pair (access + refresh).
"""
import secrets
import logging

import msal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.settings import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    MicrosoftCallbackRequest,
    MicrosoftLoginResponse,
    RefreshTokenRequest,
    Token,
)
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_msal_app() -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        client_id=settings.APPLICATION_ID,
        client_credential=settings.CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.DIRECTORY_ID}",
    )


def _build_token_pair(user: User) -> Token:
    payload = {"sub": str(user.id), "email": user.email, "role": user.role}
    return Token(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
    )


def _validate_active_user(user: User | None, source: str = "login") -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorised to access this portal. "
                   "Contact an admin to be added.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an admin.",
        )
    return user


# ---------------------------------------------------------------------------
# Manual login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token, summary="Login with email and password")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _validate_active_user(user, source="manual login")
    return _build_token_pair(user)


# ---------------------------------------------------------------------------
# Microsoft OAuth 2.0
# ---------------------------------------------------------------------------

@router.get(
    "/microsoft/login",
    response_model=MicrosoftLoginResponse,
    summary="Get Microsoft OAuth redirect URL",
)
def microsoft_login_url():
    """
    Returns the Microsoft login URL the frontend should redirect the user to.
    The `state` value must be stored client-side and passed back to /callback
    for CSRF protection.
    """
    if not settings.APPLICATION_ID or not settings.DIRECTORY_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft authentication is not configured on this server.",
        )

    state = secrets.token_urlsafe(32)
    msal_app = _get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=settings.REDIRECT_URI,
        state=state,
        prompt="select_account",
    )
    return MicrosoftLoginResponse(auth_url=auth_url, state=state)


@router.post(
    "/microsoft/callback",
    response_model=Token,
    summary="Exchange Microsoft OAuth code for JWT",
)
def microsoft_callback(body: MicrosoftCallbackRequest, db: Session = Depends(get_db)):
    """
    The frontend calls this after Microsoft redirects back with ?code=...
    Exchange the code for an id_token, extract the user's email, verify the
    user exists in our allowed-users list, then issue our own JWT.
    """
    msal_app = _get_msal_app()
    result = msal_app.acquire_token_by_authorization_code(
        code=body.code,
        scopes=["User.Read"],
        redirect_uri=settings.REDIRECT_URI,
    )

    if "error" in result:
        logger.warning("MSAL error: %s — %s", result.get("error"), result.get("error_description"))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Microsoft authentication failed: {result.get('error_description', result.get('error'))}",
        )

    claims = result.get("id_token_claims", {})
    email = (claims.get("preferred_username") or claims.get("email") or "").lower()
    name = claims.get("name") or email
    microsoft_id = claims.get("oid") or claims.get("sub") or ""

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve email from Microsoft token.",
        )

    user = db.query(User).filter(User.email == email).first()
    _validate_active_user(user, source="Microsoft OAuth")

    # Persist the microsoft_id on first MS login
    if user and not user.microsoft_id and microsoft_id:
        user.microsoft_id = microsoft_id
        db.commit()

    return _build_token_pair(user)


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=Token, summary="Refresh access token")
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    _validate_active_user(user, source="token refresh")

    return _build_token_pair(user)


# ---------------------------------------------------------------------------
# Current user
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse, summary="Get current user profile")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
