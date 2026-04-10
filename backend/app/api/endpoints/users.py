"""
User management endpoints — admin only.

Admin can:
  - List all portal users
  - Create users (optionally with a password for manual login)
  - Update user details / role / active status
  - Soft-delete (deactivate) users
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[UserResponse], summary="List all portal users")
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(User).offset(skip).limit(limit).all()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a portal user")
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    body.email = body.email.lower()

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{body.email}' already exists.",
        )

    if body.role not in ("admin", "user"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="role must be 'admin' or 'user'",
        )

    hashed = get_password_hash(body.password) if body.password else None

    user = User(
        email=body.email,
        name=body.name,
        role=body.role,
        hashed_password=hashed,
        is_active=True,
        created_by_id=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Read one
# ---------------------------------------------------------------------------

@router.get("/{user_id}", response_model=UserResponse, summary="Get a portal user")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.put("/{user_id}", response_model=UserResponse, summary="Update a portal user")
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent admin from accidentally locking themselves out
    if user.id == admin.id and body.role is not None and body.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )
    if user.id == admin.id and body.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        if body.role not in ("admin", "user"):
            raise HTTPException(status_code=422, detail="role must be 'admin' or 'user'")
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.password is not None:
        user.hashed_password = get_password_hash(body.password)

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Delete (soft)
# ---------------------------------------------------------------------------

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deactivate a portal user")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    user.is_active = False
    db.commit()
