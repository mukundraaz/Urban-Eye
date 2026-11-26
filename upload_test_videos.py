import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000/api"

def upload_and_monitor(file_path, location_name, base_lat, base_lon):
    print(f"\n--- Uploading: {file_path} ---")
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {
            "location_name": location_name,
            "base_latitude": base_lat,
            "base_longitude": base_lon,
        }
        res = requests.post(f"{BASE_URL}/videos/upload", files=files, data=data)
    
    if res.status_code != 200:
        print(f"Upload failed: {res.status_code} - {res.text}")
        return None
    
    video_info = res.json()
    video_id = video_info["id"]
    print(f"Upload successful. Video ID: {video_id}. Status: {video_info.get('status')}")

    # Poll status
    print("Waiting for AI analysis pipeline to finish...")
    for _ in range(60):
        time.sleep(2)
        st_res = requests.get(f"{BASE_URL}/videos/{video_id}/status")
        if st_res.status_code == 200:
            st = st_res.json()
            print(f"  Progress: {st.get('progress')}% | Status: {st.get('status')}")
            if st.get("status") in ["completed", "failed"]:
                break

    # Fetch detections
    det_res = requests.get(f"{BASE_URL}/detections/video/{video_id}")
    detections = det_res.json() if det_res.status_code == 200 else []
    print(f"\nResult for {file_path}: {len(detections)} detections found.")
    for d in detections:
        print(f"  [{d['detection_id']}] {d['class_name']} | Conf: {d['confidence']*100:.1f}% | Time: {d['frame_timestamp']}s | Frame: {d['frame_path']}")
    return detections

if __name__ == "__main__":
    # Test 1: Pothole video
    dets1 = upload_and_monitor(
        "sample_videos/pothole_video.mp4",
        "Fergusson College Road, Pune",
        18.5204,
        73.8567
    )

    # Test 2: Normal road video
    dets2 = upload_and_monitor(
        "sample_videos/normal_road_video.mp4",
        "Jangali Maharaj Road, Pune",
        18.5314,
        73.8446
    )

    print("\n--- Summary Verification ---")
    print(f"Video 1 (Pothole video): {len(dets1)} detections (expected > 0)")
    print(f"Video 2 (Normal road): {len(dets2)} detections (expected 0)")
    assert len(dets1) > 0, "Video 1 should have detected road damage"
    assert len(dets2) == 0, "Video 2 should have 0 detections"
    print("ALL VERIFICATION CHECKS PASSED!")
