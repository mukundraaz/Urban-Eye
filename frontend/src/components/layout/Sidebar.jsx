import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Upload, Search, Map, Navigation, 
  Lightbulb, ClipboardList, Car, FileBarChart, 
  Eye, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Video' },
  { to: '/detections', icon: Search, label: 'Detections' },
  { to: '/map', icon: Map, label: 'GIS Map' },
  { to: '/nearby', icon: Navigation, label: 'Nearby Issues' },
  { to: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { to: '/issues', icon: ClipboardList, label: 'Issue Management' },
  { to: '/traffic', icon: Car, label: 'Traffic Intelligence' },
  { to: '/reports', icon: FileBarChart, label: 'Reports' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  
  return (
    <aside className={clsx(
      'flex flex-col h-screen bg-navy-900 text-white transition-all duration-300 relative z-20 flex-shrink-0',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-navy-700">
        <div className="w-9 h-9 bg-royal-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Eye className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-base leading-tight block">Urban Eye</span>
            <span className="text-navy-300 text-xs">Traffic Intelligence</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {!collapsed && <p className="text-navy-400 text-xs font-semibold uppercase tracking-widest px-4 mb-2">Navigation</p>}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 group mb-0.5',
              isActive
                ? 'bg-royal-600 text-white'
                : 'text-navy-300 hover:bg-navy-700 hover:text-white'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-navy-700 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 bg-royal-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-navy-400 capitalize">{user?.role || 'analyst'}</p>
            </div>
            <button onClick={logout} className="ml-auto text-navy-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 text-navy-400 hover:text-white hover:bg-navy-700 rounded-lg transition-all duration-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
