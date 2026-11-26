from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.services.video_service import save_video_file, create_video_record, get_video, get_all_videos, update_video_status
from app.services.detection_service import create_detection, get_detections
from app.services.ai_service import run_ai_analysis
from app.config import settings
import os

router = APIRouter()

def process_video_background(video_id: int, file_path: str, db_url: str):
    """Background task: run AI analysis and store results."""
    import traceback
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        video = get_video(db, video_id)
        if not video:
            print(f"[VideoProcessing] Error: Video {video_id} not found in database.")
            return

        base_lat = video.base_latitude
        base_lon = video.base_longitude
        loc_name = video.location_name

        print(f"[VideoProcessing] Starting AI analysis for video {video_id} ({video.filename}) at '{file_path}'")
        update_video_status(db, video_id, "processing", 15)

        detections_data = run_ai_analysis(
            file_path,
            video_id,
            base_lat=base_lat,
            base_lon=base_lon,
            location_name=loc_name
        )
        print(f"[VideoProcessing] Inference complete. Found {len(detections_data)} detections for video {video_id}.")
        update_video_status(db, video_id, "processing", 75)

        created_count = 0
        for det_data in detections_data:
            create_detection(db, det_data)
            created_count += 1

        print(f"[VideoProcessing] Successfully stored {created_count} detections in database.")
        update_video_status(db, video_id, "completed", 100)
    except Exception as e:
        err_msg = f"{type(e).__name__}: {str(e)}"
        print(f"[VideoProcessing] FAILED for video {video_id}: {err_msg}")
        traceback.print_exc()
        update_video_status(db, video_id, "failed", 0, error_message=err_msg)
    finally:
        db.close()

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    location_name: Optional[str] = Form(None),
    base_latitude: Optional[float] = Form(None),
    base_longitude: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        saved = save_video_file(file, settings.UPLOAD_DIR)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    video = create_video_record(
        db, saved["filename"], file.filename,
        saved["file_path"], saved["file_size"]
    )
    if location_name:
        video.location_name = location_name
    if base_latitude:
        video.base_latitude = base_latitude
    if base_longitude:
        video.base_longitude = base_longitude
    db.commit()
    
    background_tasks.add_task(process_video_background, video.id, saved["file_path"], settings.DATABASE_URL)
    
    return {
        "id": video.id, "filename": video.filename, "original_name": video.original_name,
        "file_size": video.file_size, "status": video.status,
        "message": f"Video uploaded. AI analysis started in {'demo' if settings.AI_MODE == 'demo' else 'model'} mode."
    }

@router.get("/")
async def list_videos(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    videos = get_all_videos(db, skip, limit)
    result = []
    for v in videos:
        result.append({
            "id": v.id, "filename": v.filename, "original_name": v.original_name,
            "file_size": v.file_size, "status": v.status, "processing_progress": v.processing_progress,
            "location_name": v.location_name, "created_at": str(v.created_at),
            "detection_count": len(v.detections) if v.detections else 0
        })
    return result

@router.get("/{video_id}")
async def get_video_detail(video_id: int, db: Session = Depends(get_db)):
    video = get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return {
        "id": video.id, "filename": video.filename, "original_name": video.original_name,
        "file_size": video.file_size, "status": video.status, "processing_progress": video.processing_progress,
        "location_name": video.location_name, "base_latitude": video.base_latitude,
        "base_longitude": video.base_longitude, "created_at": str(video.created_at),
        "detection_count": len(video.detections) if video.detections else 0,
        "error_message": getattr(video, 'error_message', None)
    }

@router.get("/{video_id}/status")
async def get_video_status(video_id: int, db: Session = Depends(get_db)):
    video = get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return {
        "status": video.status,
        "progress": video.processing_progress,
        "id": video.id,
        "error_message": getattr(video, 'error_message', None)
    }
