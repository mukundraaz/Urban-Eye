/**
 * DEMO DATA — Clearly labelled sample detections for Urban Eye demo mode.
 * These are NOT real AI detections. Used only when no backend is available.
 */
export const DEMO_DETECTIONS = [
  {
    id: 1, detection_id: 'DEMO-001', class_name: 'Pothole', category: 'road_damage',
    confidence: 0.94, severity: 'critical', video_id: 1,
    frame_timestamp: 12.5, latitude: 18.5204, longitude: 73.8567,
    location_name: 'Shivajinagar, Pune', status: 'new', is_demo: 'true',
    description: 'Large pothole detected on main road causing hazard to vehicles and pedestrians.',
    recommended_action: 'Immediate road repair required. Close lane if necessary. Contact PWD department within 24 hours.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2, detection_id: 'DEMO-002', class_name: 'Waterlogging', category: 'infrastructure',
    confidence: 0.89, severity: 'high', video_id: 1,
    frame_timestamp: 28.0, latitude: 18.5314, longitude: 73.8446,
    location_name: 'Deccan Gymkhana, Pune', status: 'under_review', is_demo: 'true',
    description: 'Significant water accumulation blocking half the road due to blocked drainage.',
    recommended_action: 'Deploy water pumps. Inspect and clear blocked drainage systems within 48 hours.',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3, detection_id: 'DEMO-003', class_name: 'Missing Zebra Crossing', category: 'infrastructure',
    confidence: 0.87, severity: 'medium', video_id: 1,
    frame_timestamp: 45.2, latitude: 18.5089, longitude: 73.8259,
    location_name: 'Kothrud, Pune', status: 'assigned', is_demo: 'true',
    description: 'Pedestrian zebra crossing markings completely faded near school zone.',
    recommended_action: 'Schedule road marking repainting. Install temporary pedestrian warning signs.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4, detection_id: 'DEMO-004', class_name: 'Damaged Traffic Sign', category: 'infrastructure',
    confidence: 0.91, severity: 'high', video_id: 1,
    frame_timestamp: 58.7, latitude: 18.5642, longitude: 73.9018,
    location_name: 'Viman Nagar, Pune', status: 'in_progress', is_demo: 'true',
    description: 'Speed limit signboard heavily damaged and unreadable.',
    recommended_action: 'Inspect signboard. Replace damaged sign within 48 hours.',
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 5, detection_id: 'DEMO-005', class_name: 'Traffic Congestion', category: 'traffic',
    confidence: 0.96, severity: 'high', video_id: 1,
    frame_timestamp: 72.1, latitude: 18.4968, longitude: 73.8600,
    location_name: 'Swargate, Pune', status: 'new', is_demo: 'true',
    description: 'Severe traffic buildup at major intersection causing 15+ minute delays.',
    recommended_action: 'Deploy traffic personnel. Review signal timing. Consider traffic diversion via Ring Road.',
    created_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 6, detection_id: 'DEMO-006', class_name: 'Road Crack', category: 'road_damage',
    confidence: 0.83, severity: 'medium', video_id: 1,
    frame_timestamp: 85.3, latitude: 18.5460, longitude: 73.8694,
    location_name: 'Yerwada, Pune', status: 'new', is_demo: 'true',
    description: 'Extensive road surface cracking indicating structural deterioration.',
    recommended_action: 'Schedule road resurfacing. Apply temporary patching to prevent escalation.',
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 7, detection_id: 'DEMO-007', class_name: 'Unsafe Pedestrian Crossing', category: 'pedestrian',
    confidence: 0.88, severity: 'critical', video_id: 1,
    frame_timestamp: 99.0, latitude: 18.5121, longitude: 73.8396,
    location_name: 'Paud Road, Pune', status: 'new', is_demo: 'true',
    description: 'Pedestrians crossing 6-lane highway without any safety infrastructure.',
    recommended_action: 'Install pedestrian guardrails immediately. Add warning signs. Consider signal installation.',
    created_at: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 8, detection_id: 'DEMO-008', class_name: 'Missing Road Divider', category: 'infrastructure',
    confidence: 0.79, severity: 'high', video_id: 1,
    frame_timestamp: 114.5, latitude: 18.5236, longitude: 73.9020,
    location_name: 'Kalyani Nagar, Pune', status: 'assigned', is_demo: 'true',
    description: 'Road median divider missing for 50m stretch allowing dangerous wrong-way driving.',
    recommended_action: 'Install temporary jersey barriers. Schedule permanent divider installation within 1 week.',
    created_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 9, detection_id: 'DEMO-009', class_name: 'Rash Driving', category: 'traffic',
    confidence: 0.72, severity: 'critical', video_id: 1,
    frame_timestamp: 128.2, latitude: 18.4953, longitude: 73.8395,
    location_name: 'Bibvewadi, Pune', status: 'under_review', is_demo: 'true',
    description: 'Vehicle detected driving at excessive speed in school zone during peak hours.',
    recommended_action: 'Alert traffic police immediately. Review footage for enforcement action. Install speed cameras.',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 10, detection_id: 'DEMO-010', class_name: 'School Zone Violation', category: 'pedestrian',
    confidence: 0.93, severity: 'critical', video_id: 1,
    frame_timestamp: 142.8, latitude: 18.5820, longitude: 73.9145,
    location_name: 'Wagholi, Pune', status: 'new', is_demo: 'true',
    description: 'School children crossing road without crossing guard or proper safety measures.',
    recommended_action: 'Immediate deployment of crossing guard. Install pedestrian crossing signals. Speed calming measures.',
    created_at: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 11, detection_id: 'DEMO-011', class_name: 'Pothole', category: 'road_damage',
    confidence: 0.91, severity: 'high', video_id: 1,
    frame_timestamp: 156.0, latitude: 18.5390, longitude: 73.8099,
    location_name: 'Baner, Pune', status: 'resolved', is_demo: 'true',
    description: 'Multiple potholes in cluster causing vehicle damage.',
    recommended_action: 'Emergency road repair. Temporary signage for motorists.',
    created_at: new Date(Date.now() - 604800000).toISOString()
  },
  {
    id: 12, detection_id: 'DEMO-012', class_name: 'Waterlogging', category: 'infrastructure',
    confidence: 0.85, severity: 'medium', video_id: 1,
    frame_timestamp: 170.3, latitude: 18.5590, longitude: 73.9290,
    location_name: 'Kharadi, Pune', status: 'in_progress', is_demo: 'true',
    description: 'Moderate waterlogging at underpass during monsoon conditions.',
    recommended_action: 'Inspect underpass drainage. Install water level sensors.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
]

export const DEMO_STATS = {
  total_videos: 3,
  total_detections: 12,
  critical_issues: 4,
  road_defects: 3,
  traffic_incidents: 2,
  resolved_issues: 1
}

export const DEMO_VIDEO = {
  id: 1, filename: 'demo_road_survey.mp4', original_name: 'pune_road_survey_nov2024.mp4',
  file_size: 245.7, status: 'completed', processing_progress: 100,
  location_name: 'Pune City Survey Route', created_at: new Date(Date.now() - 3600000).toISOString(),
  detection_count: 12
}
