import React, { useEffect, useCallback, memo } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Ensure Leaflet is globally accessible for Leaflet plugins
if (typeof window !== 'undefined') {
  window.L = L
}

import 'leaflet/dist/leaflet.css'
import 'leaflet-minimap'
import 'leaflet-minimap/dist/Control.MiniMap.min.css'
import 'leaflet-mouse-position'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import { formatConfidence } from '../../utils/formatters.js'

// Fix Leaflet default icon paths in bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export const BASE_MAP_CONFIG = {
  satellite: {
    label: 'Satellite',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Satellite Maps',
    maxZoom: 20,
  },
  streets: {
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Terrain Maps',
    maxZoom: 20,
  },
  hybrid: {
    label: 'Hybrid',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Hybrid Imagery',
    maxZoom: 20,
  },
  dark: {
    label: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
  },
  light: {
    label: 'Light Clean',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19,
  },
}

const GEOJSON_STYLE = {
  color: '#2563eb',
  weight: 3,
  fillColor: '#60a5fa',
  fillOpacity: 0.35,
}

export function createSeverityIcon(severity, isSelected = false) {
  const color = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  }[severity?.toLowerCase()] || '#6b7280'

  const size = isSelected ? 34 : 28
  const height = isSelected ? 48 : 40
  const anchorX = isSelected ? 17 : 14
  const strokeWidth = isSelected ? 2.5 : 1.5

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${height}">
    <filter id="shadow-${severity}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" 
          fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}" filter="url(#shadow-${severity})"/>
    <circle cx="12" cy="12" r="${isSelected ? 6 : 4.5}" fill="#ffffff" opacity="0.95"/>
    ${isSelected ? '<circle cx="12" cy="12" r="2.5" fill="' + color + '"/>' : ''}
  </svg>`

  return L.divIcon({
    html: svg,
    iconSize: [size, height],
    iconAnchor: [anchorX, height],
    popupAnchor: [0, -height],
    className: 'urbaneye-custom-marker',
  })
}

const ZoomToLayers = memo(({ geoLayers, activeLayers }) => {
  const map = useMap()

  useEffect(() => {
    if (!geoLayers || !activeLayers) return
    const activeGeoJSON = geoLayers
      .filter((layer) => activeLayers[layer.id])
      .map((layer) => L.geoJSON(layer.data))

    if (activeGeoJSON.length === 0) return

    const group = L.featureGroup(activeGeoJSON)
    const bounds = group.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        animate: true,
        maxZoom: 16,
      })
    }
  }, [map, geoLayers, activeLayers])

  return null
})

ZoomToLayers.displayName = 'ZoomToLayers'

const CustomControls = memo(({ selectedBaseMap }) => {
  const map = useMap()

  useEffect(() => {
    const currentConfig =
      BASE_MAP_CONFIG[selectedBaseMap] || BASE_MAP_CONFIG.satellite

    const miniMapLayer = L.tileLayer(currentConfig.url, {
      subdomains: currentConfig.subdomains,
      maxZoom: 18,
    })

    let miniMap = null
    try {
      if (L.Control.MiniMap) {
        miniMap = new L.Control.MiniMap(miniMapLayer, {
          toggleDisplay: true,
          minimized: true,
          position: 'bottomright',
          width: 180,
          height: 140,
          aimingRectOptions: { color: '#2563eb', weight: 2 },
        })
        miniMap.addTo(map)
      }
    } catch (e) {
      console.warn('MiniMap init warning:', e)
    }

    const zoomControl = L.control.zoom({ position: 'topright' })
    zoomControl.addTo(map)

    let mousePositionControl = null
    try {
      if (L.control.mousePosition) {
        mousePositionControl = L.control.mousePosition({
          position: 'bottomleft',
          prefix: 'GPS: ',
          separator: ' , ',
          numDigits: 5,
        })
        mousePositionControl.addTo(map)
      }
    } catch (e) {
      console.warn('MousePosition init warning:', e)
    }

    const scaleControl = L.control.scale({ position: 'bottomleft', imperial: false })
    scaleControl.addTo(map)

    return () => {
      try {
        if (zoomControl) map.removeControl(zoomControl)
        if (mousePositionControl) map.removeControl(mousePositionControl)
        if (scaleControl) map.removeControl(scaleControl)
        if (miniMap) map.removeControl(miniMap)
      } catch (err) {
        // Safe unmount
      }
    }
  }, [map, selectedBaseMap])

  return null
})

CustomControls.displayName = 'CustomControls'

const DynamicTileLayer = memo(({ selectedBaseMap }) => {
  const currentMap =
    BASE_MAP_CONFIG[selectedBaseMap] || BASE_MAP_CONFIG.satellite

  return (
    <TileLayer
      key={selectedBaseMap}
      attribution={currentMap.attribution}
      url={currentMap.url}
      subdomains={currentMap.subdomains}
      maxZoom={currentMap.maxZoom || 19}
    />
  )
})

DynamicTileLayer.displayName = 'DynamicTileLayer'

const SearchControl = memo(() => {
  const map = useMap()

  useEffect(() => {
    let geoSearch = null
    let toggle = null
    try {
      const provider = new OpenStreetMapProvider()
      geoSearch = new GeoSearchControl({
        provider,
        style: 'bar',
        autoComplete: true,
        autoCompleteDelay: 250,
        showMarker: true,
        showPopup: false,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
      })

      map.addControl(geoSearch)

      // Floating Toggle Button for Search
      toggle = L.control({ position: 'topleft' })
      toggle.onAdd = () => {
        const btn = L.DomUtil.create('button', 'search-toggle')
        btn.innerHTML = '🔍'
        btn.title = 'Toggle Location Search'

        Object.assign(btn.style, {
          backgroundColor: '#1e293b',
          color: '#ffffff',
          border: '1px solid #334155',
          borderRadius: '8px',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          zIndex: '9999',
          transition: 'all 0.2s',
        })

        btn.onmouseenter = () => {
          btn.style.backgroundColor = '#2563eb'
        }
        btn.onmouseleave = () => {
          btn.style.backgroundColor = '#1e293b'
        }

        let visible = true
        btn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (visible) {
            map.removeControl(geoSearch)
          } else {
            map.addControl(geoSearch)
          }
          visible = !visible
        }

        return btn
      }

      toggle.addTo(map)
    } catch (e) {
      console.warn('GeoSearchControl init warning:', e)
    }

    return () => {
      try {
        if (geoSearch) map.removeControl(geoSearch)
        if (toggle) map.removeControl(toggle)
      } catch (err) {
        // Safe unmount
      }
    }
  }, [map])

  return null
})

SearchControl.displayName = 'SearchControl'

export default function LiveMapDisplay({
  markers = [],
  selectedMarker = null,
  onSelectMarker,
  geoLayers = [],
  activeLayers = {},
  selectedBaseMap = 'satellite',
  center = [18.5204, 73.8567],
  zoom = 13,
}) {
  const onEachFeature = useCallback((feature, layerObj) => {
    if (feature.properties?.name) {
      layerObj.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; font-weight: 600; color: #0f172a; padding: 4px;">
          ${feature.properties.name}
        </div>
      `)
    }
  }, [])

  return (
    <div className="w-full h-full relative" data-testid="live-map-display">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#0b1120' }}
      >
        <DynamicTileLayer selectedBaseMap={selectedBaseMap} />

        {/* GeoJSON Overlays */}
        {geoLayers.map(
          (layer) =>
            activeLayers[layer.id] && (
              <GeoJSON
                key={layer.id}
                data={layer.data}
                style={GEOJSON_STYLE}
                onEachFeature={onEachFeature}
              />
            )
        )}

        {/* Real Detections / Issue Markers */}
        {markers.map((marker) => {
          const isSelected = selectedMarker?.id === marker.id
          return (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createSeverityIcon(marker.severity, isSelected)}
              eventHandlers={{
                click: () => onSelectMarker && onSelectMarker(marker),
              }}
            >
              <Popup>
                <div className="p-2 text-xs min-w-[200px] text-slate-800">
                  <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {marker.class_name || marker.category || 'Road Defect'}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                      style={{
                        backgroundColor:
                          {
                            critical: '#ef4444',
                            high: '#f97316',
                            medium: '#eab308',
                            low: '#22c55e',
                          }[marker.severity?.toLowerCase()] || '#6b7280',
                      }}
                    >
                      {marker.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 mb-1">
                    📍 {marker.location_name || `${marker.latitude?.toFixed(4)}, ${marker.longitude?.toFixed(4)}`}
                  </p>
                  <p className="text-slate-600">
                    Confidence: <strong>{formatConfidence(marker.confidence)}</strong>
                  </p>
                  <p className="text-slate-600">
                    Status: <strong className="capitalize">{marker.status || 'detected'}</strong>
                  </p>
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => onSelectMarker && onSelectMarker(marker)}
                      className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 w-full font-medium"
                    >
                      View Full Intelligence
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <ZoomToLayers geoLayers={geoLayers} activeLayers={activeLayers} />
        <CustomControls selectedBaseMap={selectedBaseMap} />
        <SearchControl />
      </MapContainer>
    </div>
  )
}
