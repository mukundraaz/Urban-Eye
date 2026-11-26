from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services.detection_service import get_map_markers
from app.services.gps_service import haversine_distance
from app.models.detection import Detection

router = APIRouter()

@router.get("/markers")
async def get_markers(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    markers = get_map_markers(db)
    if category and category != "all":
        markers = [m for m in markers if m["category"] == category]
    if severity and severity != "all":
        markers = [m for m in markers if m["severity"] == severity]
    return markers

@router.get("/nearby")
async def get_nearby_issues(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_m: float = Query(1000),
    db: Session = Depends(get_db)
):
    all_markers = get_map_markers(db)
    nearby = []
    for m in all_markers:
        if m["latitude"] and m["longitude"]:
            dist = haversine_distance(lat, lon, m["latitude"], m["longitude"])
            if dist <= radius_m:
                m["distance_m"] = round(dist)
                nearby.append(m)
    nearby.sort(key=lambda x: x["distance_m"])
    return nearby

@router.get("/heatmap")
async def get_heatmap_data(db: Session = Depends(get_db)):
    detections = db.query(Detection).filter(
        Detection.latitude.isnot(None),
        Detection.longitude.isnot(None)
    ).all()
    return [
        {"lat": d.latitude, "lon": d.longitude, "intensity": 1.0 if d.severity == "critical" else 0.7 if d.severity == "high" else 0.4}
        for d in detections
    ]
