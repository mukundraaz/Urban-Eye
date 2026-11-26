import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Layers,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Maximize2,
  ExternalLink,
  MapPin,
  Calendar,
  Activity,
  Crosshair,
} from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { SeverityBadge, CategoryBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import { DETECTION_CATEGORIES, DETECTION_SEVERITIES } from '../utils/constants.js'
import { formatConfidence, formatDate } from '../utils/formatters.js'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import apiClient from '../api/client.js'
import LiveMapDisplay from '../components/map/LiveMapDisplay.jsx'
import MapLayersControl from '../components/map/MapLayersControl.jsx'
import { geoLayers } from '../components/map/geoLayers.js'

const LEGEND = [
  { color: '#ef4444', label: 'Critical / Pothole (D40)' },
  { color: '#f97316', label: 'High / Severe Cracking (D00/D20)' },
  { color: '#eab308', label: 'Medium / Transverse (D10)' },
  { color: '#22c55e', label: 'Low / Minor Irregularity' },
]

export default function MapPage() {
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveSync, setLiveSync] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Selected defect marker
  const [selected, setSelected] = useState(null)

  // Map Cartography & Overlays State
  const [selectedBaseMap, setSelectedBaseMap] = useState('satellite')
  const [activeLayers, setActiveLayers] = useState({
    road_corridor: true,
    town_center: true,
    main_road: true,
    residential: false,
  })

  // Active side panel tab: 'details' or 'layers'
  const [sideTab, setSideTab] = useState('details')

  // Load real markers from backend API
  const fetchMarkers = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await apiClient.get('/map/markers')
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setMarkers(res.data)
      } else {
        // Fallback to DEMO_DETECTIONS if DB has zero detections
        setMarkers(DEMO_DETECTIONS)
      }
      setLastSyncTime(new Date())
    } catch (err) {
      console.warn('Could not fetch /map/markers, using fallback demo data:', err)
      setMarkers(DEMO_DETECTIONS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMarkers(false)
  }, [fetchMarkers])

  // Live polling interval for real-time video detection updates
  useEffect(() => {
    if (!liveSync) return

    const intervalId = setInterval(() => {
      fetchMarkers(true)
    }, 12000)

    return () => clearInterval(intervalId)
  }, [liveSync, fetchMarkers])

  const toggleLayer = useCallback((layerId) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }))
  }, [])

  const filteredMarkers = markers.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
    if (severityFilter !== 'all' && m.severity !== severityFilter) return false
    return m.latitude && m.longitude
  })

  if (loading) return <PageLoader message="Initializing Urban Eye Live GIS Map..." />

  // Calculate center of map: either selected marker, first marker, or default Pune coordinates
  const mapCenter = selected
    ? [selected.latitude, selected.longitude]
    : filteredMarkers.length > 0
    ? [filteredMarkers[0].latitude, filteredMarkers[0].longitude]
    : [18.5204, 73.8567]

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <SlidersHorizontal size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                Filters:
              </span>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-xs sm:text-sm py-1.5 px-3 w-auto min-w-[140px]"
            >
              {DETECTION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input text-xs sm:text-sm py-1.5 px-3 w-auto min-w-[140px]"
            >
              {DETECTION_SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
              {filteredMarkers.length} issues plotted
            </span>
          </div>

          {/* Sync & Panel Controls */}
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={() => setLiveSync(!liveSync)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                liveSync
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title={liveSync ? 'Live Auto-Sync Active' : 'Live Auto-Sync Paused'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {liveSync ? 'Live Radar' : 'Radar Off'}
            </button>

            <button
              onClick={() => fetchMarkers(true)}
              disabled={refreshing}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              title="Refresh Map Markers"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-500' : ''} />
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSideTab('details')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  sideTab === 'details'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Inspection
              </button>
              <button
                onClick={() => setSideTab('layers')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  sideTab === 'layers'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Layers
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Map + Inspection / Layers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '74vh' }}>
        {/* Interactive Map Display */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-sm h-full">
          <LiveMapDisplay
            markers={filteredMarkers}
            selectedMarker={selected}
            onSelectMarker={(m) => {
              setSelected(m)
              setSideTab('details')
            }}
            geoLayers={geoLayers}
            activeLayers={activeLayers}
            selectedBaseMap={selectedBaseMap}
            center={mapCenter}
            zoom={13}
          />
        </div>

        {/* Right Inspection & Layers Panel */}
        <div className="flex flex-col gap-3 overflow-hidden h-full">
          {sideTab === 'layers' ? (
            <div className="h-full overflow-y-auto pr-1">
              <MapLayersControl
                geoLayers={geoLayers}
                activeLayers={activeLayers}
                toggleLayer={toggleLayer}
                selectedBaseMap={selectedBaseMap}
                onBaseMapChange={setSelectedBaseMap}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              {/* Defect Details Card */}
              {selected ? (
                <Card className="flex-1 overflow-y-auto p-4 space-y-3.5 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b pb-2.5 border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {selected.class_name || selected.category || 'Road Defect'}
                        </h3>
                        {selected.is_demo === 'true' && <DemoBadge />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Defect Ref: <span className="font-mono text-blue-500">{selected.id}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title="Clear Selection"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1.5 flex-wrap">
                    <SeverityBadge severity={selected.severity} />
                    <CategoryBadge category={selected.category} />
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                      {selected.status || 'detected'}
                    </span>
                  </div>

                  {/* Detection Frame Snapshot (if available) */}
                  {selected.frame_path && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 relative group">
                      <img
                        src={
                          selected.frame_path.startsWith('http') || selected.frame_path.startsWith('/')
                            ? selected.frame_path
                            : `/${selected.frame_path}`
                        }
                        alt="Defect Detection Frame"
                        className="w-full h-36 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                        AI Frame Detection
                      </div>
                    </div>
                  )}

                  {/* Telemetry Details */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <p className="text-slate-400 flex items-center gap-1">
                        <Activity size={12} /> AI Confidence
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 text-sm">
                        {formatConfidence(selected.confidence)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> Detected On
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatDate(selected.created_at)}
                      </p>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <p className="text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> Location / Street
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selected.location_name || 'Pune Urban Highway Corridor'}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-slate-400 flex items-center gap-1">
                        <Crosshair size={12} /> Exact GPS Coordinates
                      </p>
                      <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        {selected.latitude?.toFixed(6)}° N, {selected.longitude?.toFixed(6)}° E
                      </p>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  {selected.recommended_action && (
                    <div className="bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-800/40 rounded-lg p-3">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                        <Info size={13} /> Recommended Repair Action
                      </p>
                      <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                        {selected.recommended_action}
                      </p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="flex-1 p-4 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                    <Crosshair size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Defect Inspector Idle
                  </h4>
                  <p className="text-xs text-slate-400 max-w-[220px] mb-3">
                    Click any marker on the live map or toggle vector layers to inspect infrastructure telemetry.
                  </p>
                  <button
                    onClick={() => setSideTab('layers')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Layers size={13} /> Switch to Map Layers Control
                  </button>
                </Card>
              )}

              {/* Map Legend Card */}
              <Card className="p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Defect Severity Code
                  </h4>
                  <span className="text-[11px] text-slate-400">IEEE Pothole Spec</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
