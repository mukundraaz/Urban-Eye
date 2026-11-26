import React, { memo } from 'react'
import { Layers as LayersIcon, Map as MapIcon, CheckSquare, Square, Globe, ShieldAlert } from 'lucide-react'

const BASE_MAPS = [
  { id: 'satellite', label: 'Satellite Imagery', desc: 'High-res satellite view' },
  { id: 'streets', label: 'Streets (OSM)', desc: 'Standard street cartography' },
  { id: 'terrain', label: 'Topographic Terrain', desc: 'Elevation & contour relief' },
  { id: 'hybrid', label: 'Hybrid Satellite', desc: 'Satellite with street labels' },
  { id: 'dark', label: 'Dark Command View', desc: 'High-contrast NOC theme' },
  { id: 'light', label: 'Light Clean', desc: 'Minimalist high-visibility view' },
]

const MapLayersControl = memo(function MapLayersControl({
  geoLayers = [],
  activeLayers = {},
  toggleLayer,
  selectedBaseMap = 'satellite',
  onBaseMapChange,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
        <LayersIcon className="text-blue-600 dark:text-blue-400" size={18} />
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-900 dark:text-white">
          GIS Map Controls
        </h3>
      </div>

      {/* Base Maps Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe size={14} /> Base Cartography
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            {BASE_MAPS.find((b) => b.id === selectedBaseMap)?.label}
          </span>
        </div>

        <div className="space-y-1.5">
          {BASE_MAPS.map((baseMap) => {
            const isSelected = selectedBaseMap === baseMap.id
            return (
              <label
                key={baseMap.id}
                onClick={() => onBaseMapChange(baseMap.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-500/50 text-blue-900 dark:text-blue-200 font-medium shadow-xs'
                    : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="baseMapOption"
                  checked={isSelected}
                  onChange={() => onBaseMapChange(baseMap.id)}
                  className="mt-0.5 h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{baseMap.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {baseMap.desc}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Overlay Layers Section */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapIcon size={14} /> Overlay Vector Layers
          </span>
          <span className="text-[11px] text-slate-500">
            {Object.values(activeLayers).filter(Boolean).length} Active
          </span>
        </div>

        <div className="space-y-1.5">
          {geoLayers.map((layer) => {
            const isActive = !!activeLayers[layer.id]
            return (
              <label
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                  isActive
                    ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-400/50 text-indigo-900 dark:text-indigo-200 font-medium'
                    : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleLayer(layer.id)}
                  className="mt-0.5 h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="font-semibold block">{layer.label}</span>
                  {layer.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {layer.description}
                    </p>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default MapLayersControl
