import { useState, useEffect } from 'react'
import { Lightbulb, Building, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { SeverityBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import { DETECTION_CATEGORIES } from '../utils/constants.js'
import apiClient from '../api/client.js'
import clsx from 'clsx'

const PRIORITY_CONFIG = {
  critical: { label: 'Immediate Action', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500', timeline: '24-48 hours' },
  high:     { label: 'High Priority', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', border: 'border-l-orange-500', timeline: '1 week' },
  medium:   { label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', border: 'border-l-yellow-500', timeline: '2-4 weeks' },
  low:      { label: 'Low Priority', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', border: 'border-l-green-500', timeline: '1-3 months' },
}

const DEPT_MAP = {
  road_damage: 'Public Works Department',
  traffic: 'Traffic Police',
  infrastructure: 'Municipal Corporation',
  pedestrian: 'Traffic Department',
}

function RecommendationCard({ detection }) {
  const [expanded, setExpanded] = useState(false)
  const pc = PRIORITY_CONFIG[detection.severity] || PRIORITY_CONFIG.low
  const dept = DEPT_MAP[detection.category] || 'Municipal Authority'
  const actions = (detection.recommended_action || '').split('. ').filter(Boolean)

  return (
    <div className={clsx('card border-l-4 hover:shadow-card-hover transition-all duration-200', pc.border)}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb size={18} className="text-royal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{detection.class_name}</p>
                <SeverityBadge severity={detection.severity} />
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', pc.color)}>{pc.label}</span>
                {detection.is_demo === 'true' && <DemoBadge />}
              </div>
              <p className="text-xs text-slate-400">{detection.location_name || 'Location N/A'}</p>
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0 mt-1" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
          {detection.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Problem Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{detection.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recommended Actions</p>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-royal-100 dark:bg-royal-900/30 text-royal-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-slate-700 dark:text-slate-300">{action}.</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
              <p className="text-slate-400 mb-0.5 flex items-center gap-1"><Building size={10} />Responsible Dept.</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{dept}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
              <p className="text-slate-400 mb-0.5 flex items-center gap-1"><Clock size={10} />Suggested Timeline</p>
              <p className="font-medium text-slate-700 dark:text-slate-300">{pc.timeline}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2">
            ⚠️ AI recommendations are advisory. All actions must be reviewed and approved by authorized officials before implementation.
          </p>
        </div>
      )}
    </div>
  )
}

export default function RecommendationsPage() {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/detections/')
        setDetections(res.data.length > 0 ? res.data : DEMO_DETECTIONS)
      } catch { setDetections(DEMO_DETECTIONS) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = (categoryFilter === 'all' ? detections : detections.filter(d => d.category === categoryFilter))
    .slice().sort((a, b) => {
      const o = { critical: 0, high: 1, medium: 2, low: 3 }
      return (o[a.severity] || 3) - (o[b.severity] || 3)
    })

  if (loading) return <PageLoader message="Loading recommendations..." />

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          These recommendations are generated by the Urban Eye AI system and are <strong>advisory only</strong>. 
          All corrective actions should be reviewed and approved by authorized municipal officials before implementation.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DETECTION_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategoryFilter(cat.value)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              categoryFilter === cat.value ? 'bg-navy-900 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            )}>
            {cat.label} ({detections.filter(d => cat.value === 'all' || d.category === cat.value).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon="search" title="No recommendations" description="Upload and analyze a video to generate AI recommendations." /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => <RecommendationCard key={d.id} detection={d} />)}
        </div>
      )}
    </div>
  )
}
