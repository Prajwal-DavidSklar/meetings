from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "user"
    password: Optional[str] = None   # Required only for manual-auth users


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None   # Set to update password


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    microsoft_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int] = None

    class Config:
        from_attributes = True
