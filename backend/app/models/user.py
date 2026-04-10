from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)      # null for MS-only users
    microsoft_id = Column(String, unique=True, nullable=True, index=True)
    role = Column(String, default="user", nullable=False) # "admin" or "user"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Self-referential relationship — who created this user
    created_by = relationship("User", remote_side=[id], foreign_keys=[created_by_id])
    # Sync logs triggered by this user
    sync_logs = relationship("SyncLog", back_populates="triggered_by")
