import os
import uuid
import shutil
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.video import UploadedVideo
from app.config import settings
from typing import Optional

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}

def save_video_file(file: UploadFile, upload_dir: str) -> dict:
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, "videos", unique_name)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
    return {"filename": unique_name, "file_path": file_path, "file_size": file_size}

def create_video_record(db: Session, filename: str, original_name: str, 
                        file_path: str, file_size: float, user_id: Optional[int] = None) -> UploadedVideo:
    video = UploadedVideo(
        filename=filename, original_name=original_name,
        file_path=file_path, file_size=file_size,
        status="uploaded", uploaded_by=user_id
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video

def update_video_status(db: Session, video_id: int, status: str, progress: int = 0, error_message: Optional[str] = None):
    video = db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()
    if video:
        video.status = status
        video.processing_progress = progress
        if error_message is not None:
            video.error_message = error_message
        db.commit()

def get_video(db: Session, video_id: int) -> Optional[UploadedVideo]:
    return db.query(UploadedVideo).filter(UploadedVideo.id == video_id).first()

def get_all_videos(db: Session, skip: int = 0, limit: int = 50):
    return db.query(UploadedVideo).order_by(UploadedVideo.created_at.desc()).offset(skip).limit(limit).all()
