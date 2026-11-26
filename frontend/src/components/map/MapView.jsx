import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { SEVERITY_COLORS } from '../../utils/constants.js'
import { formatConfidence, formatDate } from '../../utils/formatters.js'
import { SeverityBadge, CategoryBadge, DemoBadge } from '../common/Badge.jsx'

// Fix default icon issue with vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createSeverityIcon(severity) {
  const color = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[severity] || '#6b7280'
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`
  return L.divIcon({
    html: svgIcon,
    iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
    className: ''
  })
}

export default function MapView({ detections = [], center = [18.5204, 73.8567], zoom = 13, onMarkerClick, selectedLocation }) {
  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full rounded-xl" scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedLocation && (
        <Circle center={[selectedLocation.lat, selectedLocation.lon]} radius={1000} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.1 }} />
      )}
      {detections.filter(d => d.latitude && d.longitude).map(d => (
        <Marker
          key={d.id}
          position={[d.latitude, d.longitude]}
          icon={createSeverityIcon(d.severity)}
          eventHandlers={{ click: () => onMarkerClick && onMarkerClick(d) }}
        >
          <Popup className="detection-popup">
            <div className="p-3 min-w-60">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm">{d.class_name}</h3>
                {d.is_demo === 'true' && <DemoBadge />}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex gap-1 flex-wrap"><SeverityBadge severity={d.severity} /><CategoryBadge category={d.category} /></div>
                <p><span className="font-medium">Confidence:</span> {formatConfidence(d.confidence)}</p>
                <p><span className="font-medium">Location:</span> {d.location_name || 'N/A'}</p>
                <p><span className="font-medium">Lat:</span> {d.latitude?.toFixed(6)}, <span className="font-medium">Lon:</span> {d.longitude?.toFixed(6)}</p>
                <p><span className="font-medium">Status:</span> {d.status}</p>
                <p><span className="font-medium">Detected:</span> {formatDate(d.created_at)}</p>
                {d.recommended_action && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
                    <span className="font-medium">Action: </span>{d.recommended_action.substring(0, 100)}...
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
