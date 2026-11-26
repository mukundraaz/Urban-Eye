import clsx from 'clsx'

export default function Card({ children, className, ...props }) {
  return (
    <div className={clsx('card p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function KPICard({ title, value, icon: Icon, color = 'royal', trend, suffix = '' }) {
  const colorMap = {
    royal: 'bg-royal-50 dark:bg-royal-900/20 text-royal-600 dark:text-royal-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  }
  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}{suffix}</p>
          {trend && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl', colorMap[color])}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
