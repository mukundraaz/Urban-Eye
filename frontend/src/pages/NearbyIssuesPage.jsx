import { useState } from 'react'
import { Navigation, MapPin, Search } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { SeverityBadge, CategoryBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { formatDistance } from '../utils/formatters.js'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import apiClient from '../api/client.js'

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const p1 = lat1 * Math.PI / 180, p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180, dl = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SAMPLE_LOCATIONS = [
  { name: 'Shivajinagar, Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Deccan Gymkhana, Pune', lat: 18.5314, lon: 73.8446 },
  { name: 'Viman Nagar, Pune', lat: 18.5642, lon: 73.9018 },
  { name: 'Baner, Pune', lat: 18.5390, lon: 73.8099 },
  { name: 'Kharadi, Pune', lat: 18.5590, lon: 73.9290 },
]

export default function NearbyIssuesPage() {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [radius, setRadius] = useState(1000)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!lat || !lon) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await apiClient.get(`/map/nearby?lat=${lat}&lon=${lon}&radius_m=${radius}`)
      setResults(res.data)
    } catch {
      const nearby = DEMO_DETECTIONS
        .filter(d => d.latitude && d.longitude)
        .map(d => ({ ...d, distance_m: Math.round(haversine(parseFloat(lat), parseFloat(lon), d.latitude, d.longitude)) }))
        .filter(d => d.distance_m <= radius)
        .sort((a, b) => a.distance_m - b.distance_m)
      setResults(nearby)
    } finally {
      setLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLon(pos.coords.longitude.toFixed(6)) },
      () => alert('Location access denied. Enter coordinates manually.')
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Navigation size={18} className="text-royal-600" /> Search Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Latitude</label>
            <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
              className="input text-sm" placeholder="18.5204" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Longitude</label>
            <input type="number" step="any" value={lon} onChange={e => setLon(e.target.value)}
              className="input text-sm" placeholder="73.8567" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Search Radius</label>
            <select value={radius} onChange={e => setRadius(Number(e.target.value))} className="input text-sm">
              {[500, 1000, 2000, 5000].map(r => (
                <option key={r} value={r}>{r >= 1000 ? `${r / 1000} km` : `${r} m`}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button onClick={search} disabled={!lat || !lon || loading} className="btn-primary text-sm py-2.5">
              <Search size={15} /> Search Nearby
            </button>
            <button onClick={useCurrentLocation} className="btn-secondary text-sm py-2">
              <MapPin size={15} /> My Location
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2">Quick select a location:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_LOCATIONS.map(l => (
              <button key={l.name} onClick={() => { setLat(l.lat.toString()); setLon(l.lon.toString()) }}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs hover:bg-royal-50 hover:text-royal-700 transition-all">
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading && <PageLoader message="Searching nearby issues..." />}

      {!loading && searched && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {results.length} issues found within {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
            </h3>
          </div>
          {results.length === 0 ? (
            <Card><EmptyState icon="search" title="No issues nearby" description="No detected issues found within the selected radius." /></Card>
          ) : (
            <div className="space-y-2">
              {results.map(d => (
                <div key={d.id} className="card p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">
                        {d.category === 'road_damage' ? '🛣️' : d.category === 'traffic' ? '🚦' : d.category === 'pedestrian' ? '🚶' : '🏗️'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{d.class_name}</p>
                        <SeverityBadge severity={d.severity} />
                        <CategoryBadge category={d.category} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{d.location_name || 'N/A'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-royal-600 dark:text-royal-400">{formatDistance(d.distance_m)}</span>
                      <p className="text-xs text-slate-400">away</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
