from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from app.models.detection import Detection
from app.models.recommendation import Recommendation
from app.services.ai_service import get_recommendations_for_class
import uuid

def create_detection(db: Session, detection_data: Dict) -> Detection:
    detection = Detection(**detection_data)
    db.add(detection)
    db.commit()
    db.refresh(detection)
    # Auto-generate recommendations
    recs = get_recommendations_for_class(detection.class_name)
    for rec in recs:
        recommendation = Recommendation(
            detection_id=detection.id,
            action=rec["action"],
            department=rec["department"],
            priority=rec["priority"],
            timeline=rec["timeline"]
        )
        db.add(recommendation)
    db.commit()
    return detection

def get_detections(db: Session, skip: int = 0, limit: int = 100, 
                   category: Optional[str] = None, severity: Optional[str] = None,
                   video_id: Optional[int] = None) -> List[Detection]:
    query = db.query(Detection)
    if category:
        query = query.filter(Detection.category == category)
    if severity:
        query = query.filter(Detection.severity == severity)
    if video_id:
        query = query.filter(Detection.video_id == video_id)
    return query.order_by(Detection.created_at.desc()).offset(skip).limit(limit).all()

def get_detection_stats(db: Session) -> Dict:
    total = db.query(func.count(Detection.id)).scalar()
    critical = db.query(func.count(Detection.id)).filter(Detection.severity == "critical").scalar()
    road_damage = db.query(func.count(Detection.id)).filter(Detection.category == "road_damage").scalar()
    traffic = db.query(func.count(Detection.id)).filter(Detection.category == "traffic").scalar()
    infrastructure = db.query(func.count(Detection.id)).filter(Detection.category == "infrastructure").scalar()
    pedestrian = db.query(func.count(Detection.id)).filter(Detection.category == "pedestrian").scalar()
    resolved = db.query(func.count(Detection.id)).filter(Detection.status == "resolved").scalar()
    return {
        "total": total, "critical": critical, "road_damage": road_damage,
        "traffic": traffic, "infrastructure": infrastructure, "pedestrian": pedestrian, "resolved": resolved
    }

def get_map_markers(db: Session) -> List[Dict]:
    detections = db.query(Detection).filter(
        Detection.latitude.isnot(None),
        Detection.longitude.isnot(None)
    ).all()
    markers = []
    for d in detections:
        markers.append({
            "id": d.id, "detection_id": d.detection_id, "class_name": d.class_name,
            "category": d.category, "severity": d.severity, "confidence": d.confidence,
            "latitude": d.latitude, "longitude": d.longitude, "location_name": d.location_name,
            "status": d.status, "created_at": str(d.created_at), "is_demo": d.is_demo
        })
    return markers
