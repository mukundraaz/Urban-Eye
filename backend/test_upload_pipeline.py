import urllib.request
import json
import time
import os

video_file = 'uploads/videos/092afc49-1771-498a-ba7b-1b1d1917f3bd.mp4'
if not os.path.exists(video_file):
    video_file = 'backend/uploads/videos/092afc49-1771-498a-ba7b-1b1d1917f3bd.mp4'

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = bytearray()

body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="location_name"\r\n\r\nJM Road, Pune\r\n'.encode('utf-8'))
body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="base_latitude"\r\n\r\n18.5284\r\n'.encode('utf-8'))
body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="base_longitude"\r\n\r\n73.8475\r\n'.encode('utf-8'))
body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="road_pothole_survey.mp4"\r\nContent-Type: video/mp4\r\n\r\n'.encode('utf-8'))
with open(video_file, 'rb') as f:
    body.extend(f.read())
body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/videos/upload',
    data=bytes(body),
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

with urllib.request.urlopen(req) as resp:
    upload_res = json.loads(resp.read().decode('utf-8'))
    print('Upload response:', upload_res)

video_id = upload_res['id']
print(f'Polling status for video_id={video_id}...')

for i in range(40):
    time.sleep(2)
    with urllib.request.urlopen(f'http://127.0.0.1:8000/api/videos/{video_id}/status') as sresp:
        status_res = json.loads(sresp.read().decode('utf-8'))
        print(f'Attempt {i+1}: {status_res}')
        if status_res['status'] in ['completed', 'failed']:
            break

# Check detections
with urllib.request.urlopen(f'http://127.0.0.1:8000/api/detections/?video_id={video_id}') as dresp:
    dets = json.loads(dresp.read().decode('utf-8'))
    print(f'Total detections created for video {video_id}:', len(dets))
    if dets:
        print('Sample real detection:', dets[0])
