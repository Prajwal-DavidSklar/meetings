from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)   # CSS hex color, e.g. "#4A90E2"
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])
    meeting_links = relationship("MeetingLink", back_populates="category")
