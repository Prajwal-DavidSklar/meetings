from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.category import CategoryResponse
from app.schemas.meeting_host import MeetingHostResponse


class MeetingLinkCreate(BaseModel):
    name: str
    url: str
    display_name: Optional[str] = None
    category_id: Optional[int] = None
    host_id: Optional[int] = None
    secondary_host_id: Optional[int] = None
    sort_order: int = 0
    notes: Optional[str] = None
    hours: Optional[str] = None


class MeetingLinkUpdate(BaseModel):
    display_name: Optional[str] = None
    category_id: Optional[int] = None
    host_id: Optional[int] = None
    secondary_host_id: Optional[int] = None
    clear_secondary_host: Optional[bool] = None  # Set True to remove secondary host
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    hours: Optional[str] = None
    unlock_host_override: Optional[bool] = None


class MeetingLinkResponse(BaseModel):
    id: int
    hubspot_link_id: Optional[str] = None
    name: str
    display_name: Optional[str] = None
    url: str
    slug: Optional[str] = None
    link_type: Optional[str] = None
    category_id: Optional[int] = None
    host_id: Optional[int] = None
    secondary_host_id: Optional[int] = None
    host_override_locked: bool
    image_path: Optional[str] = None
    notes: Optional[str] = None
    hours: Optional[str] = None
    is_active: bool
    hubspot_active: bool
    sort_order: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Nested for convenience
    category: Optional[CategoryResponse] = None
    host: Optional[MeetingHostResponse] = None
    secondary_host: Optional[MeetingHostResponse] = None

    class Config:
        from_attributes = True


class SyncLogResponse(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    links_added: int
    links_updated: int
    links_deactivated: int
    error_message: Optional[str] = None
    triggered_by_id: Optional[int] = None

    class Config:
        from_attributes = True
