from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="new")  # new, under_review, assigned, in_progress, resolved, rejected
    priority = Column(String, default="medium")  # critical, high, medium, low
    assigned_to = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    evidence_paths = Column(JSON, nullable=True)  # list of image paths
    comments = Column(JSON, nullable=True)         # list of {user, comment, timestamp}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    detection = relationship("Detection", back_populates="issue")
    department = relationship("Department", back_populates="issues")
