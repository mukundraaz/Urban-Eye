"""
Urban Eye – Frame Extractor
Extracts frames from video at configurable intervals using OpenCV.
"""
import cv2
from typing import Generator, Tuple
from pathlib import Path


class FrameExtractor:
    """Extract frames from a video file at a given sample rate."""

    def __init__(self, sample_rate_seconds: float = 1.0, max_frames: int = 500):
        self.sample_rate_seconds = sample_rate_seconds
        self.max_frames = max_frames

    def extract(self, video_path: str) -> Generator[Tuple[int, float, any], None, None]:
        """
        Yields (frame_number, timestamp_seconds, frame_array) tuples.
        """
        path = Path(video_path)
        if not path.exists():
            candidates = [
                Path("backend") / video_path,
                Path("..") / video_path,
                Path(str(video_path).replace("backend/", "").replace("backend\\", "")),
            ]
            found = False
            for c in candidates:
                if c.exists():
                    path = c
                    found = True
                    break
            if not found:
                raise FileNotFoundError(f"Video not found: {video_path}")

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video with OpenCV: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 25.0

        frame_interval = max(1, int(fps * self.sample_rate_seconds))
        frame_number = 0
        extracted = 0

        try:
            while extracted < self.max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_number % frame_interval == 0:
                    timestamp = frame_number / fps
                    yield frame_number, timestamp, frame
                    extracted += 1
                frame_number += 1
        finally:
            cap.release()

    def get_video_metadata(self, video_path: str) -> dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {}
        try:
            return {
                "fps": cap.get(cv2.CAP_PROP_FPS),
                "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
                "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                "duration": cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS),
            }
        finally:
            cap.release()
