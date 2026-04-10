"""
HubSpot integration service.

Fetches meeting links via the Scheduler v3 API and syncs them to the local
database, preserving all admin-managed overrides (display_name, category,
host_override_locked, image_path, sort_order).
"""
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.models.meeting_host import MeetingHost
from app.models.meeting_link import MeetingLink
from app.models.sync_log import SyncLog

logger = logging.getLogger(__name__)

_HEADERS = {
    "Authorization": f"Bearer {settings.HUBSPOT_ACCESS_TOKEN}",
    "Content-Type": "application/json",
}


# ---------------------------------------------------------------------------
# HubSpot API helpers
# ---------------------------------------------------------------------------

def _fetch_all_meeting_links() -> list[dict]:
    """
    Pages through the HubSpot Scheduler v3 meeting-links endpoint and returns
    every link as a raw dict.
    """
    url = f"{settings.HUBSPOT_API_BASE}/scheduler/v3/meetings/meeting-links"
    params: dict = {"limit": 100}
    all_links: list[dict] = []

    with httpx.Client(timeout=30.0) as client:
        while True:
            response = client.get(url, headers=_HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            all_links.extend(data.get("results", []))

            after = data.get("paging", {}).get("next", {}).get("after")
            if not after:
                break
            params = {"limit": 100, "after": after}

    logger.info("HubSpot returned %d meeting links", len(all_links))
    return all_links


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _get_or_create_host(
    db: Session,
    hubspot_owner_id: str,
    name: str,
    email: Optional[str],
) -> MeetingHost:
    """Return the existing MeetingHost for a HubSpot owner, creating one if absent."""
    host = db.query(MeetingHost).filter(
        MeetingHost.hubspot_owner_id == str(hubspot_owner_id)
    ).first()

    if not host:
        host = MeetingHost(
            name=name or "Unknown",
            email=email or None,
            hubspot_owner_id=str(hubspot_owner_id),
            is_custom=False,
            is_active=True,
        )
        db.add(host)
        db.flush()
        logger.info("Created new MeetingHost for HubSpot owner %s (%s)", hubspot_owner_id, name)
    else:
        # Keep the name / email in sync for non-custom hosts
        host.name = name or host.name
        host.email = email or host.email

    return host


# ---------------------------------------------------------------------------
# Public sync function
# ---------------------------------------------------------------------------

def sync_meeting_links(
    db: Session,
    triggered_by_id: Optional[int] = None,
) -> SyncLog:
    """
    Full sync: fetch all meeting links from HubSpot and reconcile with the DB.

    Rules:
    - New links are inserted with auto-detected host, no category.
    - Existing links: url / name / slug / link_type are refreshed.
    - display_name, category_id, image_path, sort_order are NEVER touched.
    - host_id is refreshed UNLESS host_override_locked == True.
    - Links absent from HubSpot are soft-deleted (is_active = False).
    """
    sync_log = SyncLog(status="running", triggered_by_id=triggered_by_id)
    db.add(sync_log)
    db.commit()

    try:
        hs_links = _fetch_all_meeting_links()

        added = 0
        updated = 0
        seen_ids: set[str] = set()

        for hs in hs_links:
            # HubSpot may expose the primary key as "id" or "slug"
            link_id = str(hs.get("id") or hs.get("slug", "")).strip()
            if not link_id:
                logger.warning("Skipping HubSpot link with no id/slug: %s", hs)
                continue

            seen_ids.add(link_id)

            # Extract owner fields — field names vary by HubSpot plan / version
            owner_id = hs.get("ownerId") or hs.get("userId") or hs.get("portalId")
            owner_name = (
                hs.get("ownerName")
                or hs.get("name")
                or hs.get("ownerFirstName", "") + " " + hs.get("ownerLastName", "")
            ).strip() or "Unknown"
            owner_email = hs.get("ownerEmail") or hs.get("email") or None

            link_url = (hs.get("link") or hs.get("url") or "").strip()
            link_name = (hs.get("name") or hs.get("slug") or link_id).strip()
            link_slug = (hs.get("slug") or "").strip() or None
            link_type = hs.get("type") or hs.get("linkType") or "PERSONAL_LINK"

            # Resolve host
            host: Optional[MeetingHost] = None
            if owner_id:
                host = _get_or_create_host(db, str(owner_id), owner_name, owner_email)

            existing = db.query(MeetingLink).filter(
                MeetingLink.hubspot_link_id == link_id
            ).first()

            now = datetime.now(timezone.utc)

            if existing:
                # Refresh only the HubSpot-sourced fields
                existing.name = link_name
                existing.url = link_url
                existing.slug = link_slug
                existing.link_type = link_type
                existing.is_active = True
                existing.last_synced_at = now

                # Only reassign host when admin hasn't locked the assignment
                if not existing.host_override_locked and host:
                    existing.host_id = host.id

                updated += 1
            else:
                new_link = MeetingLink(
                    hubspot_link_id=link_id,
                    name=link_name,
                    url=link_url,
                    slug=link_slug,
                    link_type=link_type,
                    host_id=host.id if host else None,
                    is_active=True,
                    last_synced_at=now,
                )
                db.add(new_link)
                added += 1

        db.flush()

        # Soft-delete links no longer returned by HubSpot
        deactivated = 0
        if seen_ids:
            result = (
                db.query(MeetingLink)
                .filter(
                    MeetingLink.hubspot_link_id.isnot(None),
                    MeetingLink.hubspot_link_id.notin_(seen_ids),
                    MeetingLink.is_active.is_(True),
                )
                .all()
            )
            for link in result:
                link.is_active = False
                deactivated += 1

        sync_log.status = "success"
        sync_log.links_added = added
        sync_log.links_updated = updated
        sync_log.links_deactivated = deactivated
        sync_log.completed_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(
            "Sync complete — added: %d, updated: %d, deactivated: %d",
            added, updated, deactivated,
        )

    except Exception as exc:
        db.rollback()
        sync_log.status = "failed"
        sync_log.error_message = str(exc)
        sync_log.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.exception("HubSpot sync failed")
        raise

    return sync_log
