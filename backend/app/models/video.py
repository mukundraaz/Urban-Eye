from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UploadedVideo(Base):
    __tablename__ = "uploaded_videos"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Float, nullable=True)  # in MB
    duration = Column(Float, nullable=True)   # in seconds
    mime_type = Column(String, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed
    processing_progress = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    fps = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    has_gps = Column(String, default="unknown")  # unknown, yes, no
    gps_source = Column(String, nullable=True)   # metadata, gpx_file, manual
    gps_data = Column(JSON, nullable=True)
    location_name = Column(String, nullable=True)
    base_latitude = Column(Float, nullable=True)
    base_longitude = Column(Float, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    uploader = relationship("User", back_populates="videos")
    detections = relationship("Detection", back_populates="video", cascade="all, delete-orphan")
