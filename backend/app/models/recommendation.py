from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=False)
    action = Column(Text, nullable=False)
    department = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # immediate, high, medium, low
    timeline = Column(String, nullable=True)   # e.g. "24-48 hours", "1 week"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    detection = relationship("Detection", back_populates="recommendations")
