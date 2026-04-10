"""
Category management endpoints.

GET  /categories/          — all authenticated users
POST /categories/          — admin only
PUT  /categories/{id}      — admin only
DELETE /categories/{id}    — admin only
"""
import re
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.db.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[CategoryResponse], summary="List all categories")
def list_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Category)
    if not include_inactive:
        q = q.filter(Category.is_active.is_(True))
    return q.order_by(Category.sort_order, Category.name).all()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a category",
)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    slug = _slugify(body.name)

    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A category with name '{body.name}' already exists.",
        )

    cat = Category(
        name=body.name.strip(),
        slug=slug,
        description=body.description,
        color=body.color,
        sort_order=body.sort_order,
        created_by_id=admin.id,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.put("/{category_id}", response_model=CategoryResponse, summary="Update a category")
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if body.name is not None:
        new_slug = _slugify(body.name)
        conflict = (
            db.query(Category)
            .filter(Category.slug == new_slug, Category.id != category_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Name already in use")
        cat.name = body.name.strip()
        cat.slug = new_slug

    if body.description is not None:
        cat.description = body.description
    if body.color is not None:
        cat.color = body.color
    if body.sort_order is not None:
        cat.sort_order = body.sort_order
    if body.is_active is not None:
        cat.is_active = body.is_active

    db.commit()
    db.refresh(cat)
    return cat


# ---------------------------------------------------------------------------
# Delete (soft)
# ---------------------------------------------------------------------------

@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a category",
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    cat.is_active = False
    db.commit()
