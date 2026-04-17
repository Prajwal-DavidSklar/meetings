from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MeetingHostCreate(BaseModel):
    name: str
    display_name: Optional[str] = None
    email: Optional[str] = None


class MeetingHostUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class MeetingHostResponse(BaseModel):
    id: int
    name: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    hubspot_owner_id: Optional[str] = None
    is_custom: bool
    is_active: bool
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
