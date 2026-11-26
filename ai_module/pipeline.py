"""
Urban Eye – Full AI Road Damage Detection Pipeline
Orchestrates:
1. Frame extraction via OpenCV
2. YOLO inference on RDD2022 road damage classes
3. Temporal & spatial tracking / deduplication across consecutive frames
4. Saving annotated detection keyframe images
5. GPS synchronization / coordinate assignment
"""
import os
import uuid
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import cv2
import numpy as np


def compute_iou(boxA: Dict, boxB: Dict) -> float:
    """Compute Intersection over Union (IoU) between two bounding boxes."""
    xA = max(boxA["x1"], boxB["x1"])
    yA = max(boxA["y1"], boxB["y1"])
    xB = min(boxA["x2"], boxB["x2"])
    yB = min(boxA["y2"], boxB["y2"])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = max(0, boxA["x2"] - boxA["x1"]) * max(0, boxA["y2"] - boxA["y1"])
    boxBArea = max(0, boxB["x2"] - boxB["x1"]) * max(0, boxB["y2"] - boxB["y1"])

    unionArea = float(boxAArea + boxBArea - interArea)
    if unionArea <= 0:
        return 0.0
    return interArea / unionArea


class UrbanEyePipeline:
    """
    End-to-end road damage detection pipeline.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        confidence_threshold: float = 0.25,
        sample_rate_seconds: float = 1.0,
        max_frames: int = 600,
        output_frames_dir: str = "uploads/frames"
    ):
        try:
            from detector import UrbanEyeDetector
        except (ImportError, AttributeError):
            from ai_module.detector import UrbanEyeDetector

        try:
            from frame_extractor import FrameExtractor
        except (ImportError, AttributeError):
            from ai_module.frame_extractor import FrameExtractor

        self.detector = UrbanEyeDetector(model_path, confidence_threshold)
        self.extractor = FrameExtractor(sample_rate_seconds, max_frames)
        self.sample_rate_seconds = sample_rate_seconds
        self.output_frames_dir = output_frames_dir

    def process_video(
        self,
        video_path: str,
        video_id: int = 0,
        gps_points: Optional[List[Dict]] = None,
        video_start_time=None,
        base_lat: Optional[float] = None,
        base_lon: Optional[float] = None,
        location_name: Optional[str] = None
    ) -> List[Dict]:
        """
        Processes video frames with real YOLO inference, deduplicates damage across consecutive
        frames, draws bounding boxes, and saves annotated keyframes.
        """
        print(f"[Pipeline] Processing video: {video_path} (ID: {video_id})")

        # Resolve output frames directory (support running from root or backend/)
        possible_dirs = [
            Path(self.output_frames_dir),
            Path("uploads/frames"),
            Path("backend/uploads/frames"),
            Path("../uploads/frames"),
        ]
        target_dir = None
        for d in possible_dirs:
            try:
                d.mkdir(parents=True, exist_ok=True)
                target_dir = d
                break
            except Exception:
                continue

        if target_dir is None:
            target_dir = Path("uploads/frames")
            target_dir.mkdir(parents=True, exist_ok=True)

        # GPS sync helper
        try:
            from gps_sync import find_coordinate_at_timestamp
            has_gps_sync = True
        except (ImportError, AttributeError):
            try:
                from ai_module.gps_sync import find_coordinate_at_timestamp
                has_gps_sync = True
            except Exception:
                has_gps_sync = False

        # Active tracks for deduplication:
        # Each track: {
        #    "detection_id": str,
        #    "class_id": int,
        #    "class_name": str,
        #    "damage_code": str,
        #    "category": str,
        #    "severity": str,
        #    "best_confidence": float,
        #    "best_bbox": dict,
        #    "best_frame_number": int,
        #    "best_timestamp": float,
        #    "best_frame_img": np.ndarray,
        #    "last_seen_timestamp": float,
        #    "latitude": float,
        #    "longitude": float,
        #    "location_name": str,
        #    "description": str,
        #    "recommended_action": str,
        #    "department": str,
        #    "occurrences": int
        # }
        tracks = []
        IOU_THRESHOLD = 0.20
        MAX_TIME_GAP = 2.0  # seconds

        frame_count = 0
        total_raw_detections = 0

        for frame_number, timestamp, frame in self.extractor.extract(video_path):
            frame_count += 1

            # Estimate GPS coordinate for this frame
            lat, lon = None, None
            if gps_points and video_start_time and has_gps_sync:
                coord = find_coordinate_at_timestamp(timestamp, video_start_time, gps_points)
                if coord:
                    lat, lon = coord
            elif base_lat and base_lon:
                # Slight geographic progression along video duration
                lat = round(base_lat + (timestamp * 0.00002), 6)
                lon = round(base_lon + (timestamp * 0.00003), 6)

            # Run YOLO detection on frame
            frame_dets = self.detector.detect_in_frame(frame, frame_number, timestamp, lat, lon)
            total_raw_detections += len(frame_dets)

            for det in frame_dets:
                bbox = det["bbox_json"]
                matched_track = None

                # Find existing track of the same class within time gap
                for track in tracks:
                    if track["class_id"] == det["class_id"]:
                        time_diff = timestamp - track["last_seen_timestamp"]
                        if 0 <= time_diff <= MAX_TIME_GAP:
                            iou = compute_iou(track["best_bbox"], bbox)
                            if iou >= IOU_THRESHOLD:
                                matched_track = track
                                break

                if matched_track is not None:
                    # Update existing track
                    matched_track["occurrences"] += 1
                    matched_track["last_seen_timestamp"] = timestamp
                    # If this frame has higher confidence, update the keyframe snapshot
                    if det["confidence"] > matched_track["best_confidence"]:
                        matched_track["best_confidence"] = det["confidence"]
                        matched_track["best_bbox"] = bbox
                        matched_track["best_frame_number"] = frame_number
                        matched_track["best_timestamp"] = timestamp
                        matched_track["best_frame_img"] = frame.copy()
                        if lat and lon:
                            matched_track["latitude"] = lat
                            matched_track["longitude"] = lon
                else:
                    # Create new track
                    tracks.append({
                        "detection_id": det["detection_id"],
                        "class_id": det["class_id"],
                        "class_name": det["class_name"],
                        "damage_code": det["damage_code"],
                        "category": det["category"],
                        "severity": det["severity"],
                        "color_bgr": det["color_bgr"],
                        "best_confidence": det["confidence"],
                        "best_bbox": bbox,
                        "best_frame_number": frame_number,
                        "best_timestamp": timestamp,
                        "best_frame_img": frame.copy(),
                        "last_seen_timestamp": timestamp,
                        "latitude": lat,
                        "longitude": lon,
                        "location_name": location_name,
                        "description": det["description"],
                        "recommended_action": det["recommended_action"],
                        "department": det["department"],
                        "occurrences": 1,
                    })

        print(f"[Pipeline] Processed {frame_count} frames. Raw detections: {total_raw_detections}. Consolidated tracks: {len(tracks)}")

        # Build final detections and save annotated keyframe images
        # Save into all valid target directories (root uploads/frames and backend/uploads/frames)
        save_dirs = []
        for d in [Path("uploads/frames"), Path("backend/uploads/frames"), Path("../uploads/frames")]:
            try:
                d.mkdir(parents=True, exist_ok=True)
                save_dirs.append(d)
            except Exception:
                pass

        final_detections = []
        for track in tracks:
            det_id = track["detection_id"]
            frame_img = track["best_frame_img"]

            # Save annotated image
            frame_rel_path = f"uploads/frames/{det_id}.jpg"
            saved_frame_path = None
            if frame_img is not None:
                # Annotate image with bounding box
                single_det = {
                    "damage_code": track["damage_code"],
                    "class_name": track["class_name"],
                    "confidence": track["best_confidence"],
                    "bbox_json": track["best_bbox"],
                    "color_bgr": track["color_bgr"],
                }
                annotated_img = self.detector.draw_detections(frame_img, [single_det])

                for sdir in save_dirs:
                    try:
                        save_file = sdir / f"{det_id}.jpg"
                        cv2.imwrite(str(save_file), annotated_img)
                        saved_frame_path = frame_rel_path
                    except Exception as e:
                        print(f"[Pipeline] Warning: failed to write frame image to {sdir}: {e}")

            final_detections.append({
                "detection_id": det_id,
                "video_id": video_id,
                "class_name": track["class_name"],
                "category": track["category"],
                "confidence": track["best_confidence"],
                "severity": track["severity"],
                "bbox_json": track["best_bbox"],
                "frame_number": track["best_frame_number"],
                "frame_timestamp": track["best_timestamp"],
                "latitude": track["latitude"],
                "longitude": track["longitude"],
                "location_name": track["location_name"],
                "frame_path": saved_frame_path,
                "status": "new",
                "is_demo": "false",
                "description": f"{track['class_name']} ({track['damage_code']}) identified with {int(track['best_confidence']*100)}% confidence. {track['description']}",
                "recommended_action": track["recommended_action"],
            })

        return final_detections


if __name__ == "__main__":
    import argparse
    import json
    import sys

    # Ensure YOLO_CONFIG_DIR is configured
    if "YOLO_CONFIG_DIR" not in os.environ:
        local_cfg = Path(__file__).resolve().parent / ".ultralytics"
        local_cfg.mkdir(parents=True, exist_ok=True)
        os.environ["YOLO_CONFIG_DIR"] = str(local_cfg)

    parser = argparse.ArgumentParser(description="Urban Eye AI Video Analysis Pipeline CLI")
    parser.add_argument("--video-path", required=True, help="Path to input road video")
    parser.add_argument("--video-id", type=int, default=0, help="Database Video ID")
    parser.add_argument("--base-lat", type=float, default=None, help="Base GPS latitude")
    parser.add_argument("--base-lon", type=float, default=None, help="Base GPS longitude")
    parser.add_argument("--location-name", type=str, default=None, help="Location / Street name")
    parser.add_argument("--output-json", type=str, default=None, help="File path to save JSON results")
    args = parser.parse_args()

    pipeline = UrbanEyePipeline()
    results = pipeline.process_video(
        video_path=args.video_path,
        video_id=args.video_id,
        base_lat=args.base_lat,
        base_lon=args.base_lon,
        location_name=args.location_name
    )

    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False)
        print(f"[Pipeline CLI] Complete. Wrote {len(results)} detections to {args.output_json}")
    else:
        print(json.dumps(results, ensure_ascii=False))
