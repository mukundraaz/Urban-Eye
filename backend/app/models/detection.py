from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String, unique=True, index=True)  # e.g. DET-001
    video_id = Column(Integer, ForeignKey("uploaded_videos.id"), nullable=True)
    class_name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # road_damage, traffic, infrastructure, pedestrian
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)  # critical, high, medium, low
    bbox_json = Column(JSON, nullable=True)   # bounding box [x1,y1,x2,y2]
    frame_timestamp = Column(Float, nullable=True)  # seconds into video
    frame_number = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    frame_path = Column(String, nullable=True)  # saved frame image path
    status = Column(String, default="new")   # new, under_review, assigned, in_progress, resolved, rejected
    is_demo = Column(String, default="false")
    description = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    video = relationship("UploadedVideo", back_populates="detections")
    issue = relationship("Issue", back_populates="detection", uselist=False)
    recommendations = relationship("Recommendation", back_populates="detection", cascade="all, delete-orphan")
