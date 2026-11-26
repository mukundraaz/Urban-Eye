export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: '#ef4444', marker: 'red' },
  high:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: '#f97316', marker: 'orange' },
  medium:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: '#eab308', marker: '#eab308' },
  low:      { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: '#22c55e', marker: 'green' },
}

export const CATEGORY_COLORS = {
  road_damage:    { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'Road Damage', icon: '🛣️' },
  traffic:        { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: 'Traffic Issues', icon: '🚦' },
  infrastructure: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', label: 'Infrastructure', icon: '🏗️' },
  pedestrian:     { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', label: 'Pedestrian Safety', icon: '🚶' },
}

export const STATUS_COLORS = {
  new:          'badge-new',
  under_review: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  assigned:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  in_progress:  'badge-in_progress',
  resolved:     'badge-resolved',
  rejected:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

export const STATUS_LABELS = {
  new: 'New', under_review: 'Under Review', assigned: 'Assigned',
  in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected'
}

export const DETECTION_CATEGORIES = [
  { value: 'all', label: 'All Issues' },
  { value: 'road_damage', label: 'Road Damage' },
  { value: 'traffic', label: 'Traffic Issues' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'pedestrian', label: 'Pedestrian Safety' },
]

export const DETECTION_SEVERITIES = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const DEPARTMENTS = [
  'Public Works Department',
  'Traffic Police',
  'Traffic Department',
  'Municipal Corporation',
  'Urban Development Authority',
  'Drainage Department',
]
