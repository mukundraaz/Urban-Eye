from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.detection import Detection
from collections import Counter

router = APIRouter()

@router.get("/stats")
async def traffic_stats(db: Session = Depends(get_db)):
    traffic_dets = db.query(Detection).filter(Detection.category == "traffic").all()
    pedestrian_dets = db.query(Detection).filter(Detection.category == "pedestrian").all()
    all_traffic = traffic_dets + pedestrian_dets
    congestion = [d for d in traffic_dets if "congestion" in d.class_name.lower()]
    vehicle_related = [d for d in traffic_dets if "driving" in d.class_name.lower() or "vehicle" in d.class_name.lower()]
    return {
        "total_traffic_incidents": len(all_traffic),
        "congestion_points": len(congestion),
        "vehicle_incidents": len(vehicle_related),
        "severity_breakdown": dict(Counter(d.severity for d in all_traffic))
    }

@router.get("/congestion")
async def congestion_points(db: Session = Depends(get_db)):
    detections = db.query(Detection).filter(
        Detection.category == "traffic",
        Detection.latitude.isnot(None)
    ).all()
    return [
        {"id": d.id, "class_name": d.class_name, "severity": d.severity,
         "latitude": d.latitude, "longitude": d.longitude, "location_name": d.location_name,
         "created_at": str(d.created_at)}
        for d in detections
    ]
