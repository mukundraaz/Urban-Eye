# AI Module — Urban Eye Detection Pipeline

This module contains the AI detection pipeline for Urban Eye.

## Architecture

```
Video Input → Frame Extraction → YOLO Detection → GPS Sync → Structured Results
```

## Setup

```bash
pip install -r requirements.txt
```

## Model Weights
Place your trained YOLOv8 weights at: `models/urbaneye_yolov8.pt`

## Running

```python
from pipeline import UrbanEyePipeline
pipeline = UrbanEyePipeline(model_path="models/urbaneye_yolov8.pt")
results = pipeline.process_video("road_video.mp4")
```

## Demo Mode
If no model is available, set `AI_MODE=demo` in the backend `.env` file.
The backend will return clearly-labelled sample detections.

## Detection Classes
See `config.yaml` for all supported detection classes and severity mappings.
