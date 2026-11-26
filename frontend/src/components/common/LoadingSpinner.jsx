import clsx from 'clsx'

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={clsx('border-2 border-slate-200 dark:border-slate-600 border-t-royal-600 rounded-full animate-spin', sizes[size], className)} />
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
    </div>
  )
}

export function ProgressBar({ value, max = 100, label, color = 'royal' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colorMap = { royal: 'bg-royal-600', green: 'bg-green-500', orange: 'bg-orange-500', red: 'bg-red-500' }
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
