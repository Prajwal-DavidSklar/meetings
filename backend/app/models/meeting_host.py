from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class MeetingHost(Base):
    __tablename__ = "meeting_hosts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)                     # Original name (from HubSpot or admin)
    display_name = Column(String, nullable=True)              # Admin-set display override
    email = Column(String, nullable=True)
    hubspot_owner_id = Column(String, unique=True, nullable=True, index=True)
    is_custom = Column(Boolean, default=False, nullable=False) # True = admin-created, not from HubSpot
    is_active = Column(Boolean, default=True, nullable=False)
    image_path = Column(String, nullable=True)                 # Admin-uploaded profile photo
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    meeting_links = relationship("MeetingLink", back_populates="host")
