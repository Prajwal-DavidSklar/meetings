from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    # JSON arrays stored as text; null means "no restriction" (all allowed)
    allowed_nav_links = Column(Text, nullable=True)      # e.g. '["live-call","new-contact"]'
    allowed_category_ids = Column(Text, nullable=True)   # e.g. '[1,2,3]'
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="permission")
