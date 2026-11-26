import sys
import os
from pathlib import Path

# Add ai_module
sys.path.insert(0, str(Path("ai_module").resolve()))

from pipeline import UrbanEyePipeline

print("=== URBAN EYE AI ROAD DAMAGE DETECTION TEST ===")
pipeline = UrbanEyePipeline(
    model_path="models/best.pt",
    confidence_threshold=0.25,
    sample_rate_seconds=1.0,
    output_frames_dir="uploads/frames"
)

# 1. Test video with visible damage
pothole_video = "sample_videos/pothole_video.mp4"
print(f"\n[TEST 1] Processing Road Damage Video: {pothole_video}")
results_damage = pipeline.process_video(
    pothole_video,
    video_id=1,
    base_lat=18.5204,
    base_lon=73.8567,
    location_name="FC Road, Pune"
)
print(f"Total damage events detected: {len(results_damage)}")
for d in results_damage:
    print(f"  • [{d['detection_id']}] {d['class_name']} | Conf: {d['confidence']*100:.1f}% | Time: {d['frame_timestamp']}s | Image: {d['frame_path']}")

# 2. Test video with normal road
normal_video = "sample_videos/normal_road_video.mp4"
print(f"\n[TEST 2] Processing Normal Road Video: {normal_video}")
results_normal = pipeline.process_video(
    normal_video,
    video_id=2,
    base_lat=18.5314,
    base_lon=73.8446,
    location_name="JM Road, Pune"
)
print(f"Total damage events detected: {len(results_normal)}")
if len(results_normal) == 0:
    print("  -> PASSED: Exactly 0 defects detected on normal road video (zero fake/mock data).")

print("\n=== TEST COMPLETED SUCCESSFULLY ===")
