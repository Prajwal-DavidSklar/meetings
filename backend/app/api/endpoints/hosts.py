"""
Meeting host management endpoints.

Hosts are either auto-created from HubSpot owners (is_custom=False) or
manually created by an admin (is_custom=True).  Admin can rename / reorganise
them freely and move meeting links between them.

GET    /hosts/           — all authenticated users
POST   /hosts/           — admin only (creates a custom host)
PUT    /hosts/{id}       — admin only
DELETE /hosts/{id}       — admin only (soft-delete; custom hosts only)
POST   /hosts/{id}/image — admin only (upload profile photo)
DELETE /hosts/{id}/image — admin only (remove profile photo)
"""
import logging
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.settings import settings

from app.api.dependencies import get_current_user, require_admin
from app.db.database import get_db
from app.models.meeting_host import MeetingHost
from app.models.user import User
from app.schemas.meeting_host import MeetingHostCreate, MeetingHostUpdate, MeetingHostResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[MeetingHostResponse], summary="List all meeting hosts")
def list_hosts(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(MeetingHost)
    if not include_inactive:
        q = q.filter(MeetingHost.is_active.is_(True))
    return q.order_by(MeetingHost.name).all()


# ---------------------------------------------------------------------------
# Create (custom host)
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=MeetingHostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a custom meeting host",
)
def create_host(
    body: MeetingHostCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    host = MeetingHost(
        name=body.name.strip(),
        display_name=body.display_name,
        email=body.email,
        is_custom=True,
        is_active=True,
    )
    db.add(host)
    db.commit()
    db.refresh(host)
    return host


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.put("/{host_id}", response_model=MeetingHostResponse, summary="Update a meeting host")
def update_host(
    host_id: int,
    body: MeetingHostUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    host = db.query(MeetingHost).filter(MeetingHost.id == host_id).first()
    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host not found")

    if body.name is not None:
        host.name = body.name.strip()
    if body.display_name is not None:
        host.display_name = body.display_name
    if body.email is not None:
        host.email = body.email
    if body.is_active is not None:
        host.is_active = body.is_active

    db.commit()
    db.refresh(host)
    return host


# ---------------------------------------------------------------------------
# Delete (soft — custom hosts only)
# ---------------------------------------------------------------------------

@router.delete(
    "/{host_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate a meeting host",
)
def delete_host(
    host_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    host = db.query(MeetingHost).filter(MeetingHost.id == host_id).first()
    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host not found")

    host.is_active = False
    db.commit()


# ---------------------------------------------------------------------------
# Image upload / delete
# ---------------------------------------------------------------------------

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post(
    "/{host_id}/image",
    response_model=MeetingHostResponse,
    summary="Upload a profile photo for a meeting host",
)
async def upload_host_image(
    host_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    host = db.query(MeetingHost).filter(MeetingHost.id == host_id).first()
    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host not found")

    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(_ALLOWED_IMAGE_TYPES)}",
        )

    data = await file.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds the 5 MB size limit.",
        )

    ext = Path(file.filename or "image").suffix.lower() or ".jpg"
    filename = f"{host_id}_{uuid.uuid4().hex}{ext}"
    dest_dir: Path = settings.UPLOADS_DIR / "host_images"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    if host.image_path:
        old = settings.UPLOADS_DIR.parent / host.image_path.lstrip("/")
        if old.exists():
            old.unlink(missing_ok=True)

    dest_path.write_bytes(data)

    host.image_path = f"/uploads/host_images/{filename}"
    db.commit()
    db.refresh(host)
    return host


@router.delete(
    "/{host_id}/image",
    response_model=MeetingHostResponse,
    summary="Remove the profile photo from a meeting host",
)
def delete_host_image(
    host_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    host = db.query(MeetingHost).filter(MeetingHost.id == host_id).first()
    if not host:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host not found")

    if host.image_path:
        file_path = settings.UPLOADS_DIR.parent / host.image_path.lstrip("/")
        file_path.unlink(missing_ok=True)
        host.image_path = None
        db.commit()
        db.refresh(host)

    return host
