from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
from app.database import get_db
from app.models.detection import Detection
from app.services.report_service import generate_csv_report, generate_summary_dict

router = APIRouter()

@router.get("/csv")
async def download_csv_report(
    video_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Detection)
    if video_id:
        query = query.filter(Detection.video_id == video_id)
    if severity and severity != "all":
        query = query.filter(Detection.severity == severity)
    detections = query.all()
    csv_bytes = generate_csv_report(detections)
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=urbaneye_detections.csv"}
    )

@router.get("/summary")
async def get_summary(video_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Detection)
    if video_id:
        query = query.filter(Detection.video_id == video_id)
    detections = query.all()
    return generate_summary_dict(detections)
