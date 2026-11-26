import { Search, Video, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const ICONS = { search: Search, video: Video, alert: AlertCircle }

export default function EmptyState({ icon = 'search', title, description, action }) {
  const Icon = ICONS[icon] || Search
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="text-slate-400 dark:text-slate-500" size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
