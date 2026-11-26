import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Video, AlertTriangle, AlertCircle, TrendingUp, Car, CheckCircle, Upload, Clock, MapPin, Eye, Activity } from 'lucide-react'
import Card, { KPICard } from '../components/common/Card.jsx'
import { SeverityBadge, StatusBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import IssuesByCategoryChart from '../components/charts/IssuesByCategoryChart.jsx'
import SeverityChart from '../components/charts/SeverityChart.jsx'
import { formatRelative, formatDate } from '../utils/formatters.js'
import { useAuth } from '../hooks/useAuth.js'
import apiClient from '../api/client.js'
import clsx from 'clsx'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, t] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/recent'),
          apiClient.get('/dashboard/trends'),
        ])
        setStats(s.data)
        setRecent(Array.isArray(r.data) ? r.data : [])
        setTrends(t.data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setStats({
          total_videos: 0,
          total_detections: 0,
          critical_issues: 0,
          road_defects: 0,
          traffic_incidents: 0,
          resolved_issues: 0,
          potholes: 0,
          longitudinal_cracks: 0,
          transverse_cracks: 0,
          alligator_cracks: 0,
        })
        setRecent([])
        setTrends({ by_category: {}, by_severity: {} })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageLoader message="Loading dashboard..." />

  const kpis = [
    { title: 'Videos Analyzed', value: stats?.total_videos ?? 0, icon: Video, color: 'royal' },
    { title: 'Issues Detected', value: stats?.total_detections ?? 0, icon: AlertTriangle, color: 'orange' },
    { title: 'Critical (Potholes)', value: stats?.potholes ?? (stats?.critical_issues ?? 0), icon: AlertCircle, color: 'red' },
    { title: 'Longitudinal Cracks', value: stats?.longitudinal_cracks ?? 0, icon: TrendingUp, color: 'yellow' },
    { title: 'Transverse Cracks', value: stats?.transverse_cracks ?? 0, icon: Activity, color: 'purple' },
    { title: 'Alligator Cracks', value: stats?.alligator_cracks ?? 0, icon: CheckCircle, color: 'green' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-navy-900 to-royal-700 rounded-xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Eye className="text-royal-400" size={24} />
              Welcome back, {user?.full_name?.split(' ')[0] || 'Official'}
            </h2>
            <p className="text-navy-200 text-sm mt-1">
              Urban Eye AI is powered by YOLO11 on the RDD2022 road damage dataset (D00, D10, D20, D40).
            </p>
          </div>
          <button onClick={() => navigate('/upload')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
            <Upload size={16} /> Upload Video
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Issues by Category</h3>
          <div className="h-56">
            <IssuesByCategoryChart data={trends?.by_category} />
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Severity Distribution</h3>
          <div className="h-56">
            <SeverityChart data={trends?.by_severity} />
          </div>
        </Card>
      </div>

      {/* Recent Detections List */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Road Damage Detections</h3>
          <button onClick={() => navigate('/detections')} className="text-xs text-royal-600 dark:text-royal-400 hover:underline font-medium">
            View All →
          </button>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No recent detections"
            description="Upload road surveillance footage to begin real AI detection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs text-slate-400 font-medium">
                  <th className="pb-3 pr-4">Detection ID</th>
                  <th className="pb-3 pr-4">Damage Class</th>
                  <th className="pb-3 pr-4">Severity</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Detected</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {recent.map(d => (
                  <tr key={d.id || d.detection_id}
                    onClick={() => navigate('/detections')}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-royal-600 dark:text-royal-400">{d.detection_id}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{d.class_name}</td>
                    <td className="py-3 pr-4"><SeverityBadge severity={d.severity} /></td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {d.location_name ? (
                        <span className="flex items-center gap-1"><MapPin size={10} />{d.location_name}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-slate-400 text-xs">{formatRelative(d.created_at)}</td>
                    <td className="py-3"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
