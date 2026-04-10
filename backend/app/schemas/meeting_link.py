from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.category import CategoryResponse
from app.schemas.meeting_host import MeetingHostResponse


class MeetingLinkUpdate(BaseModel):
    display_name: Optional[str] = None
    category_id: Optional[int] = None
    host_id: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    # Passing host_id automatically locks host_override; expose a flag so admin
    # can also explicitly unlock to re-enable sync-based host assignment.
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
    host_override_locked: bool
    image_path: Optional[str] = None
    is_active: bool
    sort_order: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Nested for convenience
    category: Optional[CategoryResponse] = None
    host: Optional[MeetingHostResponse] = None

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
