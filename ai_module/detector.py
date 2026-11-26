"""
Urban Eye – YOLO Road Damage Detector (RDD2022)
Detects road damage classes from RDD2022 dataset:
- D00: Longitudinal Crack
- D10: Transverse Crack
- D20: Alligator Crack
- D40: Pothole
"""
import os
import uuid
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import cv2
import numpy as np

# Ensure YOLO_CONFIG_DIR is set to a local writable directory before ultralytics imports
# to prevent Windows AppData\Roaming\Ultralytics permission errors
if "YOLO_CONFIG_DIR" not in os.environ:
    local_cfg = Path(__file__).resolve().parent / ".ultralytics"
    local_cfg.mkdir(parents=True, exist_ok=True)
    os.environ["YOLO_CONFIG_DIR"] = str(local_cfg)

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
    YOLO_ERROR = None
except Exception as e:
    YOLO_AVAILABLE = False
    YOLO_ERROR = str(e)


# RDD2022 Class Specifications
RDD_CLASSES = {
    0: {
        "code": "D00",
        "raw_name": "longitudinal_crack",
        "display_name": "Longitudinal Crack (D00)",
        "short_name": "Longitudinal Crack",
        "category": "road_damage",
        "severity": "high",
        "color_bgr": (0, 165, 255),      # Orange
        "color_hex": "#FFA500",
        "description": "Linear crack running parallel to road centerline, indicating pavement fatigue or joint deterioration.",
        "recommended_action": "Schedule crack sealing and rubberized asphalt filler to prevent moisture ingress.",
        "department": "Public Works Department",
    },
    1: {
        "code": "D10",
        "raw_name": "transverse_crack",
        "display_name": "Transverse Crack (D10)",
        "short_name": "Transverse Crack",
        "category": "road_damage",
        "severity": "medium",
        "color_bgr": (0, 215, 255),      # Amber/Yellow
        "color_hex": "#FFD700",
        "description": "Perpendicular crack across road surface, typically caused by temperature shrinkage or subgrade movement.",
        "recommended_action": "Apply hot-pour sealant to seal cracks and evaluate road thermal expansion joints.",
        "department": "Public Works Department",
    },
    2: {
        "code": "D20",
        "raw_name": "alligator_crack",
        "display_name": "Alligator Crack (D20)",
        "short_name": "Alligator Crack",
        "category": "road_damage",
        "severity": "high",
        "color_bgr": (0, 100, 255),      # Deep Orange / Red-Orange
        "color_hex": "#FF6400",
        "description": "Interconnected fatigue cracking pattern resembling reptile skin, indicating structural base failure under heavy traffic load.",
        "recommended_action": "Structural base failure. Schedule full-depth patching or milling and asphalt resurfacing.",
        "department": "Road Maintenance Authority",
    },
    3: {
        "code": "D40",
        "raw_name": "pothole",
        "display_name": "Pothole (D40)",
        "short_name": "Pothole",
        "category": "road_damage",
        "severity": "critical",
        "color_bgr": (0, 0, 230),        # Red
        "color_hex": "#E60000",
        "description": "Severe bowl-shaped cavity in road pavement posing acute safety hazard to vehicles and two-wheelers.",
        "recommended_action": "Immediate emergency pothole filling with cold/hot mix asphalt. Place temporary warning signage.",
        "department": "Public Works Department",
    },
}


class UrbanEyeDetector:
    """
    YOLO-based road damage detector calibrated for RDD2022.
    """

    def __init__(self, model_path: Optional[str] = None, confidence_threshold: float = 0.25):
        self.confidence_threshold = confidence_threshold
        self.model = None

        if not YOLO_AVAILABLE:
            raise RuntimeError(f"YOLO detector unavailable (Ultralytics error: {YOLO_ERROR}). Run: pip install ultralytics")

        # Resolve model path
        resolved_path = None
        candidates = [
            model_path,
            "ai_module/models/urbaneye_yolov8.pt",
            "ai_module/models/best.pt",
            "models/urbaneye_yolov8.pt",
            "models/best.pt",
            "../models/urbaneye_yolov8.pt",
            "../models/best.pt",
            "../../models/urbaneye_yolov8.pt",
            "../../models/best.pt",
            os.path.join(os.path.dirname(__file__), "models", "urbaneye_yolov8.pt"),
            os.path.join(os.path.dirname(__file__), "models", "best.pt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "urbaneye_yolov8.pt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "best.pt"),
        ]
        for p in candidates:
            if p and Path(p).exists():
                resolved_path = str(Path(p).resolve())
                break

        if not resolved_path:
            raise FileNotFoundError(
                f"Model weights not found. Tried candidates: {[c for c in candidates if c]}. "
                "Ensure ai_module/models/urbaneye_yolov8.pt or best.pt exists."
            )

        print(f"[UrbanEyeDetector] Loading YOLO model from {resolved_path}...")
        self.model = YOLO(resolved_path)
        self.model_path = resolved_path
        print(f"[UrbanEyeDetector] Model loaded successfully. Class names: {self.model.names}")

    def detect_in_frame(self, frame: np.ndarray, frame_number: int, timestamp: float,
                        latitude: Optional[float] = None, longitude: Optional[float] = None) -> List[Dict]:
        """
        Run inference on a single frame. Returns raw detections for that frame.
        """
        if self.model is None or frame is None:
            return []

        results = self.model(frame, conf=self.confidence_threshold, verbose=False)
        detections = []

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = [float(c) for c in box.xyxy[0]]

                # Map to RDD config
                cfg = RDD_CLASSES.get(class_id, {
                    "code": f"D{class_id}0",
                    "raw_name": self.model.names.get(class_id, f"class_{class_id}"),
                    "display_name": self.model.names.get(class_id, f"class_{class_id}").replace("_", " ").title(),
                    "short_name": self.model.names.get(class_id, f"class_{class_id}").replace("_", " ").title(),
                    "category": "road_damage",
                    "severity": "medium",
                    "color_bgr": (0, 255, 0),
                    "description": "Road condition anomaly detected.",
                    "recommended_action": "Inspect affected road segment.",
                    "department": "Public Works Department",
                })

                detections.append({
                    "detection_id": f"DET-{str(uuid.uuid4())[:8].upper()}",
                    "class_id": class_id,
                    "class_name": cfg["short_name"],
                    "display_name": cfg["display_name"],
                    "damage_code": cfg["code"],
                    "category": cfg["category"],
                    "confidence": round(confidence, 4),
                    "severity": cfg["severity"],
                    "color_bgr": cfg.get("color_bgr", (0, 0, 255)),
                    "bbox_json": {
                        "x1": round(x1, 1),
                        "y1": round(y1, 1),
                        "x2": round(x2, 1),
                        "y2": round(y2, 1),
                        "width": round(x2 - x1, 1),
                        "height": round(y2 - y1, 1)
                    },
                    "frame_number": frame_number,
                    "frame_timestamp": round(timestamp, 2),
                    "latitude": latitude,
                    "longitude": longitude,
                    "status": "new",
                    "is_demo": "false",
                    "description": cfg["description"],
                    "recommended_action": cfg["recommended_action"],
                    "department": cfg["department"],
                })

        return detections

    @staticmethod
    def draw_detections(frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw bounding boxes and styled labels on frame.
        """
        annotated = frame.copy()
        for det in detections:
            bbox = det.get("bbox_json", {})
            x1, y1 = int(bbox.get("x1", 0)), int(bbox.get("y1", 0))
            x2, y2 = int(bbox.get("x2", 0)), int(bbox.get("y2", 0))
            color = det.get("color_bgr", (0, 0, 255))
            label = f"{det.get('damage_code', '')} {det.get('class_name', '')} {int(det.get('confidence', 0) * 100)}%"

            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Draw filled header background for text
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.55
            thickness = 1
            (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
            header_y1 = max(0, y1 - text_h - 8)
            header_y2 = y1
            cv2.rectangle(annotated, (x1, header_y1), (x1 + text_w + 10, header_y2), color, -1)
            cv2.putText(annotated, label, (x1 + 5, y1 - 4), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

        return annotated
