import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, MapPin, Clock, ChevronRight, Image as ImageIcon, ShieldAlert, CheckCircle2 } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { SeverityBadge, CategoryBadge, StatusBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Modal from '../components/common/Modal.jsx'
import { formatDate, formatConfidence, formatTimestamp } from '../utils/formatters.js'
import { DETECTION_CATEGORIES, DETECTION_SEVERITIES } from '../utils/constants.js'
import apiClient from '../api/client.js'
import clsx from 'clsx'

export default function DetectionResultsPage() {
  const { videoId } = useParams()
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDamageType, setSelectedDamageType] = useState('all')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDetection, setSelectedDetection] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const url = videoId ? `/detections/video/${videoId}` : '/detections/'
        const res = await apiClient.get(url)
        setDetections(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error('Failed to load detections:', err)
        setDetections([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [videoId])

  const rddCounts = {
    potholes: detections.filter(d => /pothole|d40/i.test(d.class_name)).length,
    longitudinal: detections.filter(d => /longitudinal|d00/i.test(d.class_name)).length,
    transverse: detections.filter(d => /transverse|d10/i.test(d.class_name)).length,
    alligator: detections.filter(d => /alligator|d20/i.test(d.class_name)).length,
  }

  const filtered = detections.filter(d => {
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false
    if (selectedSeverity !== 'all' && d.severity !== selectedSeverity) return false
    if (selectedDamageType === 'pothole' && !/pothole|d40/i.test(d.class_name)) return false
    if (selectedDamageType === 'longitudinal' && !/longitudinal|d00/i.test(d.class_name)) return false
    if (selectedDamageType === 'transverse' && !/transverse|d10/i.test(d.class_name)) return false
    if (selectedDamageType === 'alligator' && !/alligator|d20/i.test(d.class_name)) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchName = d.class_name.toLowerCase().includes(q)
      const matchLoc = (d.location_name || '').toLowerCase().includes(q)
      const matchId = (d.detection_id || '').toLowerCase().includes(q)
      if (!matchName && !matchLoc && !matchId) return false
    }
    return true
  })

  if (loading) return <PageLoader message="Loading real AI detections..." />

  const getImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `http://localhost:8000/${path.replace(/^\/+/, '')}`
  }

  return (
    <div className="space-y-5">
      {/* RDD2022 Road Damage Intelligence Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => { setSelectedDamageType('all'); setSelectedCategory('all') }}
          className={clsx(
            'card p-3 text-left transition-all hover:shadow-card-hover border-l-4 border-l-royal-600',
            selectedDamageType === 'all' && 'ring-2 ring-royal-500'
          )}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Detected</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{detections.length}</p>
          <p className="text-[11px] text-royal-600 dark:text-royal-400 mt-1">All Damages</p>
        </button>

        <button
          onClick={() => setSelectedDamageType(selectedDamageType === 'pothole' ? 'all' : 'pothole')}
          className={clsx(
            'card p-3 text-left transition-all hover:shadow-card-hover border-l-4 border-l-red-500',
            selectedDamageType === 'pothole' && 'ring-2 ring-red-500'
          )}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Potholes (D40)</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{rddCounts.potholes}</p>
          <p className="text-[11px] text-slate-400 mt-1">Critical severity</p>
        </button>

        <button
          onClick={() => setSelectedDamageType(selectedDamageType === 'longitudinal' ? 'all' : 'longitudinal')}
          className={clsx(
            'card p-3 text-left transition-all hover:shadow-card-hover border-l-4 border-l-amber-500',
            selectedDamageType === 'longitudinal' && 'ring-2 ring-amber-500'
          )}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Longitudinal (D00)</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{rddCounts.longitudinal}</p>
          <p className="text-[11px] text-slate-400 mt-1">Parallel cracks</p>
        </button>

        <button
          onClick={() => setSelectedDamageType(selectedDamageType === 'transverse' ? 'all' : 'transverse')}
          className={clsx(
            'card p-3 text-left transition-all hover:shadow-card-hover border-l-4 border-l-yellow-500',
            selectedDamageType === 'transverse' && 'ring-2 ring-yellow-500'
          )}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Transverse (D10)</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">{rddCounts.transverse}</p>
          <p className="text-[11px] text-slate-400 mt-1">Thermal cracks</p>
        </button>

        <button
          onClick={() => setSelectedDamageType(selectedDamageType === 'alligator' ? 'all' : 'alligator')}
          className={clsx(
            'card p-3 text-left transition-all hover:shadow-card-hover border-l-4 border-l-orange-500',
            selectedDamageType === 'alligator' && 'ring-2 ring-orange-500'
          )}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Alligator (D20)</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{rddCounts.alligator}</p>
          <p className="text-[11px] text-slate-400 mt-1">Structural fatigue</p>
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by defect type, ID, or location..."
              className="input pl-9 text-sm"
            />
          </div>
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="input text-sm w-auto">
            {DETECTION_SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => navigate('/map')} className="btn-secondary text-sm">
            <MapPin size={15} /> View on Map
          </button>
        </div>
      </Card>

      {/* Detection List */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              No Road Damage Detected
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {videoId
                ? "The AI model analyzed this video using OpenCV & YOLO11 and found 0 road defects. The pavement surface appears in normal condition."
                : "No road damage records match the current filters. Upload a road surveillance video to run real-time AI detection."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <div
              key={d.id || d.detection_id}
              onClick={() => setSelectedDetection(d)}
              className="card p-4 cursor-pointer hover:shadow-card-hover transition-all hover:border-royal-300 dark:hover:border-royal-700">
              <div className="flex items-center gap-4">
                {/* Thumbnail Preview */}
                {d.frame_path ? (
                  <div className="w-16 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black flex-shrink-0">
                    <img
                      src={getImageUrl(d.frame_path)}
                      alt={d.class_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                    d.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    d.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  )}>
                    🛣️
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white">{d.class_name}</p>
                    <SeverityBadge severity={d.severity} />
                    <CategoryBadge category={d.category} />
                    <StatusBadge status={d.status} />
                    {d.is_demo === 'true' && <DemoBadge />}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="font-mono text-royal-600 dark:text-royal-400">{d.detection_id}</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Conf: {formatConfidence(d.confidence)}
                    </span>
                    {d.frame_timestamp != null && (
                      <span>
                        <Clock size={11} className="inline mr-1" />
                        {formatTimestamp(d.frame_timestamp)}
                      </span>
                    )}
                    {d.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {d.location_name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600 flex-shrink-0" size={18} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal with Real Frame Evidence */}
      <Modal isOpen={!!selectedDetection} onClose={() => setSelectedDetection(null)} title="AI Road Damage Detection Details" size="lg">
        {selectedDetection && (
          <div className="space-y-4">
            {/* Annotated Frame Display */}
            {selectedDetection.frame_path ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                <img
                  src={getImageUrl(selectedDetection.frame_path)}
                  alt={selectedDetection.class_name}
                  className="w-full max-h-80 object-contain mx-auto"
                />
                <div className="bg-slate-900/90 text-slate-300 text-xs px-3 py-1.5 flex justify-between items-center">
                  <span>Target Bounding Box Evidence (OpenCV YOLO Inference)</span>
                  <span className="font-mono">{formatTimestamp(selectedDetection.frame_timestamp)}</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {selectedDetection.class_name}
              </span>
              <SeverityBadge severity={selectedDetection.severity} />
              <CategoryBadge category={selectedDetection.category} />
              <StatusBadge status={selectedDetection.status} />
              {selectedDetection.is_demo === 'true' && <DemoBadge />}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Detection ID</p>
                <p className="font-medium text-slate-900 dark:text-white font-mono text-xs">{selectedDetection.detection_id}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Confidence Score</p>
                <p className="font-bold text-royal-600 dark:text-royal-400">{formatConfidence(selectedDetection.confidence)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Video Timestamp</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatTimestamp(selectedDetection.frame_timestamp)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Frame Number</p>
                <p className="font-medium text-slate-900 dark:text-white">#{selectedDetection.frame_number ?? 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Latitude</p>
                <p className="font-medium text-slate-900 dark:text-white">{selectedDetection.latitude?.toFixed(6) || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Longitude</p>
                <p className="font-medium text-slate-900 dark:text-white">{selectedDetection.longitude?.toFixed(6) || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Location</p>
                <p className="font-medium text-slate-900 dark:text-white truncate">{selectedDetection.location_name || 'Assigned via Telemetry'}</p>
              </div>
            </div>

            {selectedDetection.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Issue Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {selectedDetection.description}
                </p>
              </div>
            )}

            {selectedDetection.recommended_action && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                  AI Recommended Corrective Action
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  {selectedDetection.recommended_action}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setSelectedDetection(null); navigate('/map') }}
                className="btn-secondary text-sm">
                <MapPin size={15} /> View on GIS Map
              </button>
              <button
                onClick={() => { setSelectedDetection(null); navigate('/issues') }}
                className="btn-primary text-sm">
                Manage In Action Center
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
