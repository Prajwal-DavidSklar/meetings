"""
HubSpot integration service.

Sync strategy
-------------
1. Pre-fetch every owner from /crm/v3/owners — builds two lookup dicts
   keyed by owner-id and by user-id so we can resolve whichever reference
   the meeting-links endpoint happens to use (organizerUserId, ownerId, …).
2. Fetch all meeting links from /scheduler/v3/meetings/meeting-links.
3. For each link resolve its owner → find-or-create a MeetingHost row.
4. Insert new links, refresh mutable HubSpot fields on existing ones.
5. Respect admin overrides:
   - display_name, category_id, image_path, sort_order are never touched.
   - host_id is only updated when host_override_locked is False.
6. Soft-delete links no longer returned by HubSpot.
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

def _paginate(client: httpx.Client, url: str, params: dict) -> list[dict]:
    """Generic paginator for HubSpot cursor-based endpoints."""
    results: list[dict] = []
    while True:
        response = client.get(url, headers=_HEADERS, params=params)
        response.raise_for_status()
        data = response.json()
        results.extend(data.get("results", []))
        after = data.get("paging", {}).get("next", {}).get("after")
        if not after:
            break
        params = {**params, "after": after}
    return results


def _fetch_owners() -> tuple[dict[str, dict], dict[str, dict]]:
    """
    Fetch all (non-archived) HubSpot owners.

    Returns two dicts for flexible lookup:
      by_owner_id  — {owner["id"]     -> owner}
      by_user_id   — {owner["userId"] -> owner}

    An owner object looks like:
      {"id": "12345", "email": "...", "firstName": "Jane", "lastName": "Doe",
       "userId": 678900, "archived": false}
    """
    url = f"{settings.HUBSPOT_API_BASE}/crm/v3/owners"
    with httpx.Client(timeout=30.0) as client:
        owners = _paginate(client, url, {"limit": 100, "archived": "false"})

    by_owner_id: dict[str, dict] = {}
    by_user_id: dict[str, dict] = {}
    for o in owners:
        oid = str(o.get("id", ""))
        uid = str(o.get("userId", ""))
        if oid:
            by_owner_id[oid] = o
        if uid and uid != "None":
            by_user_id[uid] = o

    logger.info("Fetched %d HubSpot owners", len(by_owner_id))
    return by_owner_id, by_user_id


def _fetch_all_meeting_links() -> list[dict]:
    """Fetch every meeting link from the Scheduler v3 endpoint."""
    url = f"{settings.HUBSPOT_API_BASE}/scheduler/v3/meetings/meeting-links"
    with httpx.Client(timeout=30.0) as client:
        links = _paginate(client, url, {"limit": 100})
    logger.info("HubSpot returned %d meeting links", len(links))
    return links


def _resolve_owner(
    hs_link: dict,
    by_owner_id: dict[str, dict],
    by_user_id: dict[str, dict],
) -> Optional[dict]:
    """
    Try every known field name that HubSpot uses to reference the link owner.
    Returns the owner dict from /crm/v3/owners, or None if not found.

    Field names seen across HubSpot plans / API versions:
      organizerUserId  — most common in Scheduler v3 (maps to owner.userId)
      ownerId          — maps to owner.id
      userId           — alias for organizerUserId on some plans
    """
    # Log the link keys on first call to help with debugging unknown fields
    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Meeting link fields: %s", list(hs_link.keys()))

    candidates = [
        ("organizerUserId", by_user_id),
        ("userId",          by_user_id),
        ("ownerId",         by_owner_id),
    ]
    for field, lookup in candidates:
        raw = hs_link.get(field)
        if raw is not None:
            owner = lookup.get(str(raw))
            if owner:
                logger.debug("Resolved owner via field '%s'=%s → %s %s",
                             field, raw,
                             owner.get("firstName", ""), owner.get("lastName", ""))
                return owner
            # Field exists but ID not in owners — log once at WARNING
            logger.warning(
                "Meeting link has %s=%s but no matching owner found. "
                "Raw link data: %s",
                field, raw, hs_link,
            )
    return None


def _owner_display_name(owner: dict) -> str:
    first = (owner.get("firstName") or "").strip()
    last = (owner.get("lastName") or "").strip()
    full = f"{first} {last}".strip()
    return full or owner.get("email") or "Unknown"


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _get_or_create_host(
    db: Session,
    hubspot_owner_id: str,
    name: str,
    email: Optional[str],
) -> MeetingHost:
    """Find an existing HubSpot-sourced MeetingHost or create one."""
    host = db.query(MeetingHost).filter(
        MeetingHost.hubspot_owner_id == hubspot_owner_id
    ).first()

    if not host:
        host = MeetingHost(
            name=name,
            email=email,
            hubspot_owner_id=hubspot_owner_id,
            is_custom=False,
            is_active=True,
        )
        db.add(host)
        db.flush()
        logger.info("Created MeetingHost '%s' (HubSpot owner %s)", name, hubspot_owner_id)
    else:
        # Refresh name/email from HubSpot (non-custom hosts only)
        if not host.is_custom:
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
    Full sync. See module docstring for the complete strategy.
    """
    sync_log = SyncLog(status="running", triggered_by_id=triggered_by_id)
    db.add(sync_log)
    db.commit()

    try:
        # Step 1 — build owner lookup tables
        by_owner_id, by_user_id = _fetch_owners()

        # Step 2 — fetch meeting links
        hs_links = _fetch_all_meeting_links()

        added = 0
        updated = 0
        seen_ids: set[str] = set()
        now = datetime.now(timezone.utc)

        for hs in hs_links:
            link_id = str(hs.get("id") or hs.get("slug") or "").strip()
            if not link_id:
                logger.warning("Skipping link with no id/slug: %s", hs)
                continue

            seen_ids.add(link_id)

            link_url  = (hs.get("link") or hs.get("url") or "").strip()
            link_name = (hs.get("name") or hs.get("slug") or link_id).strip()
            link_slug = (hs.get("slug") or "").strip() or None
            link_type = hs.get("type") or hs.get("linkType") or "PERSONAL_LINK"

            # Step 3 — resolve owner → host
            host: Optional[MeetingHost] = None
            owner = _resolve_owner(hs, by_owner_id, by_user_id)
            if owner:
                host = _get_or_create_host(
                    db,
                    hubspot_owner_id=str(owner["id"]),
                    name=_owner_display_name(owner),
                    email=owner.get("email"),
                )

            existing = db.query(MeetingLink).filter(
                MeetingLink.hubspot_link_id == link_id
            ).first()

            if existing:
                # Refresh HubSpot-sourced fields only
                existing.name = link_name
                existing.url = link_url
                existing.slug = link_slug
                existing.link_type = link_type
                existing.is_active = True
                existing.last_synced_at = now

                # Respect admin host override
                if not existing.host_override_locked and host:
                    existing.host_id = host.id

                updated += 1
            else:
                db.add(MeetingLink(
                    hubspot_link_id=link_id,
                    name=link_name,
                    url=link_url,
                    slug=link_slug,
                    link_type=link_type,
                    host_id=host.id if host else None,
                    is_active=True,
                    last_synced_at=now,
                ))
                added += 1

        db.flush()

        # Step 6 — soft-delete links no longer in HubSpot
        deactivated = 0
        if seen_ids:
            gone = (
                db.query(MeetingLink)
                .filter(
                    MeetingLink.hubspot_link_id.isnot(None),
                    MeetingLink.hubspot_link_id.notin_(seen_ids),
                    MeetingLink.is_active.is_(True),
                )
                .all()
            )
            for link in gone:
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
