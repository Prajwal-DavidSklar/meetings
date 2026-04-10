from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.sql import func

from app.db.postgres import Base


class ExampleModel(Base):
    """Example model to demonstrate table creation and migrations."""
    
    __tablename__ = "example"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # This would typically be used to store flexible JSON data
    # like HVAC equipment specs, readings, etc.
    data = Column(MutableDict.as_mutable(JSONB), nullable=True)
    
    def __repr__(self):
        return f"<Example(id={self.id}, name='{self.name}')>"