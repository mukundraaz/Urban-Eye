from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.detection import Detection
from app.models.video import UploadedVideo
from app.models.issue import Issue
from collections import Counter
import datetime

router = APIRouter()

@router.get("/stats")
async def dashboard_stats(db: Session = Depends(get_db)):
    total_videos = db.query(func.count(UploadedVideo.id)).scalar()
    total_detections = db.query(func.count(Detection.id)).scalar()
    critical = db.query(func.count(Detection.id)).filter(Detection.severity == "critical").scalar()
    road_damage = db.query(func.count(Detection.id)).filter(Detection.category == "road_damage").scalar()
    traffic_issues = db.query(func.count(Detection.id)).filter(Detection.category == "traffic").scalar()
    resolved = db.query(func.count(Detection.id)).filter(Detection.status == "resolved").scalar()

    potholes = db.query(func.count(Detection.id)).filter(Detection.class_name.ilike("%Pothole%")).scalar()
    longitudinal_cracks = db.query(func.count(Detection.id)).filter(Detection.class_name.ilike("%Longitudinal%")).scalar()
    transverse_cracks = db.query(func.count(Detection.id)).filter(Detection.class_name.ilike("%Transverse%")).scalar()
    alligator_cracks = db.query(func.count(Detection.id)).filter(Detection.class_name.ilike("%Alligator%")).scalar()

    return {
        "total_videos": total_videos,
        "total_detections": total_detections,
        "critical_issues": critical,
        "road_defects": road_damage,
        "traffic_incidents": traffic_issues,
        "resolved_issues": resolved,
        "potholes": potholes,
        "longitudinal_cracks": longitudinal_cracks,
        "transverse_cracks": transverse_cracks,
        "alligator_cracks": alligator_cracks,
    }

@router.get("/recent")
async def recent_detections(limit: int = 10, db: Session = Depends(get_db)):
    detections = db.query(Detection).order_by(Detection.created_at.desc()).limit(limit).all()
    return [
        {
            "id": d.id, "detection_id": d.detection_id, "class_name": d.class_name,
            "severity": d.severity, "location_name": d.location_name,
            "created_at": str(d.created_at), "status": d.status, "is_demo": d.is_demo
        }
        for d in detections
    ]

@router.get("/trends")
async def detection_trends(db: Session = Depends(get_db)):
    detections = db.query(Detection).all()
    by_category = Counter(d.category for d in detections)
    by_severity = Counter(d.severity for d in detections)
    return {
        "by_category": dict(by_category),
        "by_severity": dict(by_severity),
        "total": len(detections)
    }
