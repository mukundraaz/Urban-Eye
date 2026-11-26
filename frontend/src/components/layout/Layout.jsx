import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Urban road & traffic intelligence overview' },
  '/upload': { title: 'Upload Video', subtitle: 'Upload road surveillance footage for AI analysis' },
  '/detections': { title: 'Detection Results', subtitle: 'AI-detected road and traffic issues' },
  '/map': { title: 'GIS Map', subtitle: 'Geographic visualization of detected issues' },
  '/nearby': { title: 'Nearby Issues', subtitle: 'Issues detected near a selected location' },
  '/recommendations': { title: 'AI Recommendations', subtitle: 'Actionable corrective recommendations' },
  '/issues': { title: 'Issue Management', subtitle: 'Track and manage detected issues' },
  '/traffic': { title: 'Traffic Intelligence', subtitle: 'Vehicle counts, congestion, and traffic analytics' },
  '/reports': { title: 'Reports', subtitle: 'Generate and download detection reports' },
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const basePath = '/' + location.pathname.split('/')[1]
  const meta = PAGE_META[basePath] || { title: 'Urban Eye', subtitle: '' }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB] dark:bg-slate-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
