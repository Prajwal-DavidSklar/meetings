"""
Meeting link endpoints.

Regular users can browse and filter meeting links.
Admin can recategorise links, reassign hosts, upload images, and trigger syncs.

GET  /meetings/                   — list (filterable)
GET  /meetings/{id}               — detail
PUT  /meetings/{id}               — admin: update meta (category / host / display name)
POST /meetings/{id}/image         — admin: upload a thumbnail image
DELETE /meetings/{id}/image       — admin: remove thumbnail
POST /meetings/sync               — admin: trigger HubSpot sync
GET  /meetings/sync/logs          — admin: sync history
"""
import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.core.settings import settings
from app.db.database import get_db
from app.models.meeting_link import MeetingLink
from app.models.sync_log import SyncLog
from app.models.user import User
from app.schemas.meeting_link import MeetingLinkResponse, MeetingLinkUpdate, SyncLogResponse
from app.services.hubspot_service import sync_meeting_links

logger = logging.getLogger(__name__)
router = APIRouter()

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[MeetingLinkResponse], summary="List meeting links")
def list_meetings(
    category_id: Optional[int] = None,
    host_id: Optional[int] = None,
    search: Optional[str] = None,
    include_inactive: bool = False,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(MeetingLink)

    if not include_inactive:
        q = q.filter(MeetingLink.is_active.is_(True))
    if category_id is not None:
        q = q.filter(MeetingLink.category_id == category_id)
    if host_id is not None:
        q = q.filter(MeetingLink.host_id == host_id)
    if search:
        term = f"%{search}%"
        q = q.filter(
            MeetingLink.name.ilike(term) | MeetingLink.display_name.ilike(term)
        )

    return (
        q.order_by(MeetingLink.sort_order, MeetingLink.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@router.get("/{meeting_id}", response_model=MeetingLinkResponse, summary="Get a meeting link")
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    link = db.query(MeetingLink).filter(MeetingLink.id == meeting_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting link not found")
    return link


# ---------------------------------------------------------------------------
# Update meta (admin)
# ---------------------------------------------------------------------------

@router.put("/{meeting_id}", response_model=MeetingLinkResponse, summary="Update meeting link metadata")
def update_meeting(
    meeting_id: int,
    body: MeetingLinkUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    link = db.query(MeetingLink).filter(MeetingLink.id == meeting_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting link not found")

    if body.display_name is not None:
        link.display_name = body.display_name or None  # empty string → None

    if body.category_id is not None:
        link.category_id = body.category_id

    if body.host_id is not None:
        link.host_id = body.host_id
        link.host_override_locked = True   # auto-lock so sync won't override

    if body.unlock_host_override is True:
        link.host_override_locked = False

    if body.sort_order is not None:
        link.sort_order = body.sort_order

    if body.is_active is not None:
        link.is_active = body.is_active

    db.commit()
    db.refresh(link)
    return link


# ---------------------------------------------------------------------------
# Image upload (admin)
# ---------------------------------------------------------------------------

@router.post(
    "/{meeting_id}/image",
    response_model=MeetingLinkResponse,
    summary="Upload a thumbnail image for a meeting link",
)
async def upload_image(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    link = db.query(MeetingLink).filter(MeetingLink.id == meeting_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting link not found")

    # Validate MIME type
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(_ALLOWED_IMAGE_TYPES)}",
        )

    # Read and validate size
    data = await file.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the 5 MB size limit.",
        )

    # Derive a safe filename
    ext = Path(file.filename or "image").suffix.lower() or ".jpg"
    filename = f"{meeting_id}_{uuid.uuid4().hex}{ext}"
    dest_dir: Path = settings.UPLOADS_DIR / "meeting_images"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    # Remove old image if present
    if link.image_path:
        old = settings.UPLOADS_DIR.parent / link.image_path.lstrip("/")
        if old.exists():
            old.unlink(missing_ok=True)

    dest_path.write_bytes(data)

    # Store a URL-friendly relative path served via /uploads/
    link.image_path = f"/uploads/meeting_images/{filename}"
    db.commit()
    db.refresh(link)
    return link


@router.delete(
    "/{meeting_id}/image",
    response_model=MeetingLinkResponse,
    summary="Remove the thumbnail image from a meeting link",
)
def delete_image(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    link = db.query(MeetingLink).filter(MeetingLink.id == meeting_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting link not found")

    if link.image_path:
        file_path = settings.UPLOADS_DIR.parent / link.image_path.lstrip("/")
        file_path.unlink(missing_ok=True)
        link.image_path = None
        db.commit()
        db.refresh(link)

    return link


# ---------------------------------------------------------------------------
# HubSpot sync (admin)
# ---------------------------------------------------------------------------

@router.post("/sync", response_model=SyncLogResponse, summary="Trigger a HubSpot meeting-link sync")
def trigger_sync(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if not settings.HUBSPOT_ACCESS_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="HUBSPOT_ACCESS_TOKEN is not configured.",
        )
    log = sync_meeting_links(db, triggered_by_id=admin.id)
    return log


@router.get(
    "/sync/debug-raw",
    summary="[Admin] Show raw HubSpot API response for the first meeting link",
    response_model=dict,
)
def debug_raw_hubspot(
    _: User = Depends(require_admin),
):
    """
    Returns the raw JSON of the first meeting link and first owner from HubSpot
    so you can see exactly which field names are present on your plan.
    Remove or restrict this endpoint once the sync is confirmed working.
    """
    import httpx
    from app.services.hubspot_service import _HEADERS, _paginate

    result: dict = {}
    with httpx.Client(timeout=30.0) as client:
        links = _paginate(
            client,
            f"{settings.HUBSPOT_API_BASE}/scheduler/v3/meetings/meeting-links",
            {"limit": 1},
        )
        owners = _paginate(
            client,
            f"{settings.HUBSPOT_API_BASE}/crm/v3/owners",
            {"limit": 1, "archived": "false"},
        )

    result["sample_meeting_link"] = links[0] if links else None
    result["sample_owner"] = owners[0] if owners else None
    return result


@router.get(
    "/sync/logs",
    response_model=List[SyncLogResponse],
    summary="List HubSpot sync history",
)
def list_sync_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (
        db.query(SyncLog)
        .order_by(SyncLog.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
