import clsx from 'clsx'
import { Spinner } from './LoadingSpinner.jsx'

export default function Button({ children, variant = 'primary', size = 'md', loading, icon: Icon, className, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: '', lg: 'px-6 py-3 text-base' }

  return (
    <button disabled={loading} className={clsx(variants[variant], size !== 'md' && sizes[size], className)} {...props}>
      {loading ? <Spinner size="sm" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}
