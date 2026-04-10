from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="running", nullable=False)  # running | success | failed
    links_added = Column(Integer, default=0)
    links_updated = Column(Integer, default=0)
    links_deactivated = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    triggered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    triggered_by = relationship("User", back_populates="sync_logs")
