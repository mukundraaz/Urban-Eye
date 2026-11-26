"""
GPS Service — Parse GPX files and synchronize GPS coordinates with video timestamps.
"""
from typing import List, Dict, Optional, Tuple
import math

def parse_gpx_file(gpx_path: str) -> List[Dict]:
    """Parse a GPX file and return list of {time, lat, lon, elevation} dicts."""
    try:
        import gpxpy
        with open(gpx_path, 'r') as f:
            gpx = gpxpy.parse(f)
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append({
                        "time": point.time,
                        "lat": point.latitude,
                        "lon": point.longitude,
                        "elevation": point.elevation
                    })
        return points
    except Exception as e:
        raise ValueError(f"Error parsing GPX file: {e}")

def sync_timestamp_to_gps(frame_timestamp: float, video_start_time, gps_points: List[Dict]) -> Optional[Tuple[float, float]]:
    """
    Given a video frame timestamp (seconds from start), find the closest GPS coordinate.
    Returns (latitude, longitude) or None if no match found.
    """
    if not gps_points or not video_start_time:
        return None
    target_time = video_start_time + frame_timestamp
    best_point = None
    best_diff = float('inf')
    for point in gps_points:
        if point["time"]:
            diff = abs((point["time"] - target_time).total_seconds())
            if diff < best_diff:
                best_diff = diff
                best_point = point
    if best_point and best_diff < 60:  # within 60 seconds
        return (best_point["lat"], best_point["lon"])
    return None

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two GPS points."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))
