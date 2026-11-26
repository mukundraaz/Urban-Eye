from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.services.detection_service import get_detections, get_detection_stats
from app.models.detection import Detection
from app.models.recommendation import Recommendation

router = APIRouter()

@router.get("/")
async def list_detections(
    skip: int = 0, limit: int = 100,
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    video_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Detection)
    if category and category != "all":
        query = query.filter(Detection.category == category)
    if severity and severity != "all":
        query = query.filter(Detection.severity == severity)
    if video_id:
        query = query.filter(Detection.video_id == video_id)
    if status:
        query = query.filter(Detection.status == status)
    detections = query.order_by(Detection.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_detection(d) for d in detections]

@router.get("/stats")
async def detection_stats(db: Session = Depends(get_db)):
    return get_detection_stats(db)

@router.get("/{detection_id}")
async def get_detection(detection_id: int, db: Session = Depends(get_db)):
    d = db.query(Detection).filter(Detection.id == detection_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")
    result = serialize_detection(d)
    result["recommendations"] = [
        {"action": r.action, "department": r.department, "priority": r.priority, "timeline": r.timeline}
        for r in d.recommendations
    ]
    return result

@router.get("/video/{video_id}")
async def get_detections_for_video(video_id: int, db: Session = Depends(get_db)):
    detections = db.query(Detection).filter(Detection.video_id == video_id).all()
    return [serialize_detection(d) for d in detections]

def serialize_detection(d: Detection) -> dict:
    return {
        "id": d.id, "detection_id": d.detection_id, "class_name": d.class_name,
        "category": d.category, "confidence": d.confidence, "severity": d.severity,
        "bbox": d.bbox_json, "bbox_json": d.bbox_json, "frame_timestamp": d.frame_timestamp,
        "frame_number": d.frame_number, "latitude": d.latitude, "longitude": d.longitude,
        "location_name": d.location_name, "frame_path": d.frame_path, "status": d.status,
        "is_demo": d.is_demo, "description": d.description, "recommended_action": d.recommended_action,
        "video_id": d.video_id, "created_at": str(d.created_at)
    }
