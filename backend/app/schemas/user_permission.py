import json
from pydantic import BaseModel, field_validator
from typing import Optional, List, Any


class UserPermissionData(BaseModel):
    """Nested in UserResponse — permission data for the authenticated user."""
    allowed_nav_links: Optional[List[str]] = None
    allowed_category_ids: Optional[List[int]] = None

    @field_validator("allowed_nav_links", "allowed_category_ids", mode="before")
    @classmethod
    def _parse_json(cls, v: Any) -> Any:
        if isinstance(v, str):
            return json.loads(v)
        return v

    class Config:
        from_attributes = True


class UserPermissionUpdate(BaseModel):
    allowed_nav_links: Optional[List[str]] = None     # null = no restriction
    allowed_category_ids: Optional[List[int]] = None  # null = no restriction


class UserPermissionResponse(BaseModel):
    user_id: int
    allowed_nav_links: Optional[List[str]] = None
    allowed_category_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True
