import { Bell, Moon, Sun, Menu, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { useApp } from '../../contexts/AppContext.jsx'
import clsx from 'clsx'

export default function Header({ title, subtitle }) {
  const { isDark, toggleTheme } = useTheme()
  const { notifications, removeNotification, isDemoMode } = useApp()

  return (
    <>
      {/* Notification stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto cursor-pointer max-w-sm',
              n.type === 'success' && 'bg-green-600 text-white',
              n.type === 'error' && 'bg-red-600 text-white',
              n.type === 'warning' && 'bg-orange-500 text-white',
              (!n.type || n.type === 'info') && 'bg-navy-800 text-white',
            )}
            onClick={() => removeNotification(n.id)}
          >
            {n.type === 'success' ? <CheckCircle size={16} /> : n.type === 'error' ? <AlertCircle size={16} /> : <Info size={16} />}
            {n.message}
          </div>
        ))}
      </div>

      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              DEMO MODE
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
    </>
  )
}
