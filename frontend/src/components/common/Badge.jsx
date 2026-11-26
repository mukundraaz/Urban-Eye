import clsx from 'clsx'
import { SEVERITY_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../utils/constants.js'
import { capitalize } from '../../utils/formatters.js'

export function SeverityBadge({ severity }) {
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', colors.bg, colors.text)}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }}></span>
      {capitalize(severity)}
    </span>
  )
}

export function CategoryBadge({ category }) {
  const colors = {
    road_damage: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    traffic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    infrastructure: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pedestrian: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }
  const labels = { road_damage: 'Road Damage', traffic: 'Traffic', infrastructure: 'Infrastructure', pedestrian: 'Pedestrian' }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', colors[category] || 'bg-slate-100 text-slate-600')}>
      {labels[category] || capitalize(category)}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[status] || 'bg-slate-100 text-slate-600')}>
      {STATUS_LABELS[status] || capitalize(status)}
    </span>
  )
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      ⚠️ DEMO
    </span>
  )
}
