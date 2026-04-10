from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None       # Hex color string, e.g. "#4A90E2"
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
