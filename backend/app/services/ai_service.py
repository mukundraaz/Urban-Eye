"""
AI Service — Integration layer for Urban Eye detection pipeline.
AI_MODE=demo: Returns realistic demo detections (clearly labelled).
AI_MODE=model: Calls the ai_module pipeline with actual YOLO11/YOLOv8 model trained on RDD2022.
"""
import uuid
import random
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from app.config import settings

DEMO_DETECTION_CLASSES = [
    {"class_name": "Pothole", "category": "road_damage", "severity": "critical",
     "description": "Large pothole detected on road surface causing hazard to vehicles",
     "recommended_action": "Immediate road repair required. Close lane if necessary. Contact PWD department.",
     "department": "Public Works Department"},
    {"class_name": "Longitudinal Crack", "category": "road_damage", "severity": "high",
     "description": "Longitudinal crack (D00) running along traffic flow indicating pavement fatigue",
     "recommended_action": "Schedule crack sealing with hot-pour asphalt mastic.",
     "department": "Public Works Department"},
    {"class_name": "Transverse Crack", "category": "road_damage", "severity": "medium",
     "description": "Transverse crack (D10) across road surface caused by thermal contraction",
     "recommended_action": "Apply joint sealant to prevent water infiltration.",
     "department": "Public Works Department"},
    {"class_name": "Alligator Crack", "category": "road_damage", "severity": "high",
     "description": "Alligator fatigue cracking (D20) indicating structural base failure",
     "recommended_action": "Schedule full-depth pavement patching and asphalt overlay.",
     "department": "Public Works Department"},
    {"class_name": "Waterlogging", "category": "infrastructure", "severity": "high",
     "description": "Water accumulation on road surface due to blocked or inadequate drainage",
     "recommended_action": "Inspect and clear drainage system. Schedule drain maintenance.",
     "department": "Municipal Corporation"},
    {"class_name": "Missing Zebra Crossing", "category": "infrastructure", "severity": "medium",
     "description": "Pedestrian zebra crossing markings are faded or missing",
     "recommended_action": "Schedule road marking repainting. Install temporary pedestrian warning signs.",
     "department": "Traffic Department"},
    {"class_name": "Damaged Traffic Sign", "category": "infrastructure", "severity": "high",
     "description": "Traffic signboard is damaged, missing, or unreadable",
     "recommended_action": "Inspect signboard. Replace or repair damaged sign within 48 hours.",
     "department": "Traffic Department"},
    {"class_name": "Traffic Congestion", "category": "traffic", "severity": "medium",
     "description": "Heavy traffic buildup detected causing significant delays",
     "recommended_action": "Deploy traffic personnel. Review signal timing. Consider traffic diversion.",
     "department": "Traffic Police"},
]

PUNE_LOCATIONS = [
    {"lat": 18.5204, "lon": 73.8567, "name": "Shivajinagar"},
    {"lat": 18.5314, "lon": 73.8446, "name": "Deccan Gymkhana"},
    {"lat": 18.5089, "lon": 73.8259, "name": "Kothrud"},
    {"lat": 18.5642, "lon": 73.9018, "name": "Viman Nagar"},
    {"lat": 18.4968, "lon": 73.8600, "name": "Swargate"},
    {"lat": 18.5460, "lon": 73.8694, "name": "Yerwada"},
    {"lat": 18.5121, "lon": 73.8396, "name": "Paud Road"},
    {"lat": 18.5236, "lon": 73.9020, "name": "Kalyani Nagar"},
    {"lat": 18.4953, "lon": 73.8395, "name": "Bibvewadi"},
    {"lat": 18.5820, "lon": 73.9145, "name": "Wagholi"},
    {"lat": 18.5390, "lon": 73.8099, "name": "Baner"},
    {"lat": 18.5590, "lon": 73.9290, "name": "Kharadi"},
]

RECOMMENDATION_MAP = {
    "Pothole": [
        {"action": "Mark pothole location and restrict lane access", "department": "Traffic Police", "priority": "immediate", "timeline": "Same day"},
        {"action": "Dispatch emergency road crew for cold/hot mix asphalt filling", "department": "Public Works Department", "priority": "immediate", "timeline": "24-48 hours"},
        {"action": "Inspect surrounding road surface for subbase moisture degradation", "department": "Public Works Department", "priority": "high", "timeline": "1 week"},
    ],
    "Longitudinal Crack": [
        {"action": "Seal crack with rubberized asphalt mastic before water seepage occurs", "department": "Public Works Department", "priority": "high", "timeline": "3-5 days"},
        {"action": "Inspect pavement joint alignment and compaction quality", "department": "Public Works Department", "priority": "medium", "timeline": "2 weeks"},
    ],
    "Transverse Crack": [
        {"action": "Clean crack with compressed air and install hot-poured sealant", "department": "Public Works Department", "priority": "medium", "timeline": "1 week"},
        {"action": "Evaluate thermal contraction behavior and subgrade stability", "department": "Public Works Department", "priority": "low", "timeline": "1 month"},
    ],
    "Alligator Crack": [
        {"action": "Erect rough road warning signage for heavy vehicles and two-wheelers", "department": "Traffic Police", "priority": "high", "timeline": "24 hours"},
        {"action": "Full-depth structural repair and base reconstruction required", "department": "Road Maintenance Authority", "priority": "immediate", "timeline": "1-2 weeks"},
        {"action": "Schedule comprehensive asphalt mill and overlay resurfacing", "department": "Public Works Department", "priority": "high", "timeline": "3 weeks"},
    ],
    "Waterlogging": [
        {"action": "Deploy mobile water dewatering pumps immediately", "department": "Municipal Corporation", "priority": "immediate", "timeline": "Same day"},
        {"action": "Inspect and clean blocked stormwater drainage catch basins", "department": "Municipal Corporation", "priority": "high", "timeline": "48 hours"},
    ],
    "Missing Zebra Crossing": [
        {"action": "Install temporary pedestrian caution signage", "department": "Traffic Department", "priority": "high", "timeline": "48 hours"},
        {"action": "Repaint reflective thermoplastic zebra crossing markings", "department": "Public Works Department", "priority": "medium", "timeline": "1-2 weeks"},
    ],
    "Damaged Traffic Sign": [
        {"action": "Inspect damaged signboard and assess visibility risk", "department": "Traffic Department", "priority": "high", "timeline": "24 hours"},
        {"action": "Replace damaged retroreflective signboard panel", "department": "Traffic Department", "priority": "high", "timeline": "48 hours"},
    ],
    "Traffic Congestion": [
        {"action": "Deploy traffic personnel to manage congestion bottleneck", "department": "Traffic Police", "priority": "immediate", "timeline": "Same day"},
        {"action": "Review and adapt adaptive traffic signal cycle timings", "department": "Traffic Department", "priority": "medium", "timeline": "1 week"},
    ],
}

def get_recommendations_for_class(class_name: str) -> List[Dict]:
    """Return structured recommendations for a detected class."""
    # Check exact match or partial match
    for key, recs in RECOMMENDATION_MAP.items():
        if key.lower() in class_name.lower():
            return recs
    return [
        {"action": f"Inspect detected {class_name} issue and assess road hazard", "department": "Public Works Department", "priority": "medium", "timeline": "1 week"},
        {"action": f"Schedule appropriate corrective maintenance for {class_name}", "department": "Municipal Authority", "priority": "medium", "timeline": "2 weeks"},
    ]


def generate_demo_detections(video_id: int, num_detections: int = 8) -> List[Dict]:
    """Generate realistic demo detections for a video when demo mode is explicitly requested."""
    detections = []
    classes_to_use = random.sample(DEMO_DETECTION_CLASSES, min(num_detections, len(DEMO_DETECTION_CLASSES)))
    
    for i, cls in enumerate(classes_to_use):
        location = random.choice(PUNE_LOCATIONS)
        lat_offset = random.uniform(-0.003, 0.003)
        lon_offset = random.uniform(-0.003, 0.003)
        
        detection = {
            "detection_id": f"DEMO-{video_id}-{str(uuid.uuid4())[:8].upper()}",
            "video_id": video_id,
            "class_name": cls["class_name"],
            "category": cls["category"],
            "confidence": round(random.uniform(0.72, 0.98), 3),
            "severity": cls["severity"],
            "bbox_json": {
                "x1": random.randint(50, 300),
                "y1": random.randint(50, 200),
                "x2": random.randint(400, 900),
                "y2": random.randint(300, 600)
            },
            "frame_timestamp": round(random.uniform(2.0, 60.0), 2),
            "frame_number": random.randint(50, 1800),
            "latitude": round(location["lat"] + lat_offset, 6),
            "longitude": round(location["lon"] + lon_offset, 6),
            "location_name": location["name"] + ", Pune",
            "frame_path": None,
            "status": "new",
            "is_demo": "true",
            "description": cls["description"],
            "recommended_action": cls["recommended_action"],
        }
        detections.append(detection)
    
    return detections


# Ensure YOLO_CONFIG_DIR is configured before any ultralytics imports
if "YOLO_CONFIG_DIR" not in os.environ:
    curr_dir = Path(__file__).resolve().parent
    cfg_candidates = [
        curr_dir.parent.parent.parent / "ai_module" / ".ultralytics",
        curr_dir.parent.parent / "ai_module" / ".ultralytics",
        Path("ai_module/.ultralytics").resolve(),
    ]
    for c in cfg_candidates:
        if c.parent.exists():
            c.mkdir(parents=True, exist_ok=True)
            os.environ["YOLO_CONFIG_DIR"] = str(c)
            break

# Singleton pipeline instance for fast repeated inference without re-loading YOLO weights
_pipeline_instance = None

def get_pipeline():
    global _pipeline_instance
    if _pipeline_instance is None:
        # Add ai_module and project root to Python path with highest priority
        curr_file = Path(__file__).resolve()
        ai_module_dir = None
        for parent in curr_file.parents:
            candidate = parent / "ai_module"
            if candidate.exists() and (candidate / "detector.py").exists():
                ai_module_dir = candidate
                break

        if ai_module_dir:
            ai_str = str(ai_module_dir)
            if ai_str in sys.path:
                sys.path.remove(ai_str)
            sys.path.insert(0, ai_str)
            
            parent_str = str(ai_module_dir.parent)
            if parent_str in sys.path:
                sys.path.remove(parent_str)
            sys.path.insert(1, parent_str)

        print(f"[AIService] Loading UrbanEyePipeline from: {ai_module_dir}...")
        try:
            from pipeline import UrbanEyePipeline
        except ImportError:
            from ai_module.pipeline import UrbanEyePipeline

        # Find best candidate model path
        model_candidates = [
            "ai_module/models/urbaneye_yolov8.pt",
            "models/urbaneye_yolov8.pt",
            "ai_module/models/best.pt",
            "models/best.pt",
            "../ai_module/models/urbaneye_yolov8.pt",
            "../models/urbaneye_yolov8.pt",
            "../ai_module/models/best.pt",
            "../models/best.pt",
        ]
        chosen_model = "models/urbaneye_yolov8.pt"
        for mc in model_candidates:
            if Path(mc).exists():
                chosen_model = mc
                break

        _pipeline_instance = UrbanEyePipeline(
            model_path=chosen_model,
            confidence_threshold=0.25,
            sample_rate_seconds=1.0,
            max_frames=600,
            output_frames_dir="uploads/frames"
        )
    return _pipeline_instance


def find_python_with_yolo() -> Optional[str]:
    """Find a Python binary on the system that has ultralytics installed."""
    candidates = [
        r"C:\Users\mukun\AppData\Local\Programs\Python\Python310\python.exe",
        sys.executable,
        "python3.10",
        "python",
    ]
    for exe in candidates:
        if os.path.exists(exe):
            try:
                import subprocess
                res = subprocess.run(
                    [exe, "-c", "import os; os.environ['YOLO_CONFIG_DIR']='ai_module/.ultralytics'; import ultralytics"],
                    capture_output=True,
                    timeout=5
                )
                if res.returncode == 0:
                    return exe
            except Exception:
                continue
    return None


def run_ai_subprocess(
    video_path: str,
    video_id: int,
    base_lat: Optional[float] = None,
    base_lon: Optional[float] = None,
    location_name: Optional[str] = None,
    fallback_error: str = ""
) -> List[Dict]:
    """Run AI pipeline in a dedicated Python interpreter that has Ultralytics installed."""
    python_exe = find_python_with_yolo()
    if not python_exe:
        raise RuntimeError(
            f"No Python runtime with working 'ultralytics' was found. "
            f"In-process error: {fallback_error}. "
            "Please ensure Ultralytics and YOLO model weights are installed in Python 3.10."
        )

    import subprocess
    import tempfile
    import json

    curr_file = Path(__file__).resolve()
    pipeline_py = None
    for parent in curr_file.parents:
        cand = parent / "ai_module" / "pipeline.py"
        if cand.exists():
            pipeline_py = cand
            break

    if not pipeline_py:
        raise FileNotFoundError("Could not locate ai_module/pipeline.py")

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        output_json_path = tmp.name

    cmd = [
        python_exe,
        str(pipeline_py),
        "--video-path", video_path,
        "--video-id", str(video_id),
        "--output-json", output_json_path,
    ]
    if base_lat is not None:
        cmd.extend(["--base-lat", str(base_lat)])
    if base_lon is not None:
        cmd.extend(["--base-lon", str(base_lon)])
    if location_name:
        cmd.extend(["--location-name", location_name])

    env = os.environ.copy()
    env["YOLO_CONFIG_DIR"] = str(pipeline_py.parent / ".ultralytics")

    print(f"[AIService] Running AI pipeline via dedicated interpreter: {python_exe}...")
    proc = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=300)

    if proc.returncode != 0:
        err = proc.stderr or proc.stdout
        raise RuntimeError(f"AI detection subprocess failed (exit code {proc.returncode}): {err}")

    try:
        with open(output_json_path, "r", encoding="utf-8") as f:
            detections = json.load(f)
        print(f"[AIService] Subprocess returned {len(detections)} detections for video_id={video_id}")
        return detections
    finally:
        try:
            os.remove(output_json_path)
        except OSError:
            pass


def run_ai_analysis(
    video_path: str,
    video_id: int,
    gps_data: Optional[dict] = None,
    base_lat: Optional[float] = None,
    base_lon: Optional[float] = None,
    location_name: Optional[str] = None
) -> List[Dict]:
    """
    Main AI analysis function.
    - If AI_MODE=demo: returns labelled demo detections
    - If AI_MODE=model: calls the ai_module pipeline with actual YOLO model.
      If in-process execution encounters environment issues (e.g. running under Py3.12 without ultralytics),
      it automatically delegates to the dedicated Python 3.10 AI runtime.
    """
    ai_mode = getattr(settings, "AI_MODE", "model")
    print(f"[AIService] run_ai_analysis called for video_id={video_id}, mode={ai_mode}, path={video_path}")

    if ai_mode == "demo":
        return generate_demo_detections(video_id)
    elif ai_mode == "model":
        try:
            pipeline = get_pipeline()
            results = pipeline.process_video(
                video_path=video_path,
                video_id=video_id,
                base_lat=base_lat,
                base_lon=base_lon,
                location_name=location_name
            )
            print(f"[AIService] In-process pipeline returned {len(results)} detections for video_id={video_id}")
            return results
        except Exception as e:
            print(f"[AIService] In-process execution note: {e}. Trying dedicated Python AI runtime...")
            try:
                return run_ai_subprocess(
                    video_path=video_path,
                    video_id=video_id,
                    base_lat=base_lat,
                    base_lon=base_lon,
                    location_name=location_name,
                    fallback_error=str(e)
                )
            except Exception as sub_err:
                import traceback
                traceback.print_exc()
                raise RuntimeError(f"AI model pipeline error: {sub_err}")
    else:
        raise ValueError(f"Invalid AI_MODE: {ai_mode}. Must be 'demo' or 'model'.")
