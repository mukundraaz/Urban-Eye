"""Report Service — Generate PDF and CSV reports from detections."""
import csv
import io
from typing import List
from app.models.detection import Detection

def generate_csv_report(detections: List[Detection]) -> bytes:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Detection ID", "Class", "Category", "Severity", "Confidence",
        "Latitude", "Longitude", "Location", "Timestamp", "Status",
        "Description", "Recommended Action", "Is Demo"
    ])
    for d in detections:
        writer.writerow([
            d.detection_id, d.class_name, d.category, d.severity,
            f"{d.confidence:.1%}", d.latitude or "N/A", d.longitude or "N/A",
            d.location_name or "N/A", d.frame_timestamp or "N/A", d.status,
            d.description or "", d.recommended_action or "", d.is_demo
        ])
    return output.getvalue().encode()

def generate_summary_dict(detections: List[Detection]) -> dict:
    from collections import Counter
    severities = Counter(d.severity for d in detections)
    categories = Counter(d.category for d in detections)
    statuses = Counter(d.status for d in detections)
    return {
        "total_detections": len(detections),
        "by_severity": dict(severities),
        "by_category": dict(categories),
        "by_status": dict(statuses),
        "avg_confidence": round(sum(d.confidence for d in detections) / len(detections), 3) if detections else 0
    }
