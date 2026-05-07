from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class MeetingLink(Base):
    __tablename__ = "meeting_links"

    id = Column(Integer, primary_key=True, index=True)
    hubspot_link_id = Column(String, unique=True, nullable=True, index=True)  # null = custom/manual

    # Original values from HubSpot — preserved, never overwritten by admin
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    slug = Column(String, nullable=True)
    link_type = Column(String, nullable=True)          # e.g. PERSONAL_LINK, TEAM_LINK

    # Admin-controlled overrides (preserved across syncs)
    display_name = Column(String, nullable=True)       # Override shown in the UI
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    host_id = Column(Integer, ForeignKey("meeting_hosts.id"), nullable=True)
    host_override_locked = Column(Boolean, default=False, nullable=False)
    # When True the sync will NOT reassign host_id even if the HubSpot owner changes.
    # Set automatically when admin manually changes the host.

    image_path = Column(String, nullable=True)         # Relative path under /uploads
    notes = Column(Text, nullable=True)                # Admin-authored notes shown to users
    hours = Column(Text, nullable=True)                # Admin-authored hours shown on meeting card

    is_active = Column(Boolean, default=True, nullable=False)   # admin show/hide
    hubspot_active = Column(Boolean, default=True, nullable=False)  # False = absent from HubSpot; always True for manual links
    sort_order = Column(Integer, default=0, nullable=False)

    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    secondary_host_id = Column(Integer, ForeignKey("meeting_hosts.id"), nullable=True)

    category = relationship("Category", back_populates="meeting_links")
    host = relationship("MeetingHost", foreign_keys=[host_id], back_populates="meeting_links")
    secondary_host = relationship("MeetingHost", foreign_keys=[secondary_host_id], back_populates="secondary_meeting_links")
