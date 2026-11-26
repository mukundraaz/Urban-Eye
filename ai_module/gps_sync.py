"""
Urban Eye – GPS Synchronizer
Parses GPX files and synchronizes GPS coordinates with video timestamps.
"""
import math
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone


def parse_gpx(gpx_path: str) -> List[Dict]:
    """Parse a GPX file. Returns list of {time, lat, lon, elevation}."""
    try:
        import gpxpy
        with open(gpx_path, "r") as f:
            gpx = gpxpy.parse(f)
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for pt in segment.points:
                    points.append({
                        "time": pt.time,
                        "lat": pt.latitude,
                        "lon": pt.longitude,
                        "elevation": pt.elevation,
                    })
        return points
    except Exception as e:
        raise ValueError(f"Error parsing GPX file: {e}")


def find_coordinate_at_timestamp(
    video_timestamp_sec: float,
    video_start_time: Optional[datetime],
    gps_points: List[Dict]
) -> Optional[Tuple[float, float]]:
    """
    Find the GPS coordinate at a given video timestamp.
    Returns (lat, lon) or None.
    """
    if not gps_points or not video_start_time:
        return None

    target = video_start_time.timestamp() + video_timestamp_sec
    best, best_diff = None, float("inf")

    for pt in gps_points:
        if pt["time"]:
            t = pt["time"].timestamp() if hasattr(pt["time"], "timestamp") else pt["time"]
            diff = abs(t - target)
            if diff < best_diff:
                best_diff = diff
                best = pt

    if best and best_diff < 60:  # within 60 seconds
        return (best["lat"], best["lon"])
    return None


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two GPS points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dl / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))
