import { useState, useEffect } from 'react'
import { Car, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)
import Card, { KPICard } from '../components/common/Card.jsx'
import { SeverityBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import apiClient from '../api/client.js'

const DEMO_TRAFFIC = DEMO_DETECTIONS.filter(d => d.category === 'traffic' || d.category === 'pedestrian')

export default function TrafficIntelligencePage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/traffic/stats')
        setStats(res.data)
      } catch {
        setStats({ total_traffic_incidents: DEMO_TRAFFIC.length, congestion_points: 2, vehicle_incidents: 2, severity_breakdown: { critical: 2, high: 2 } })
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <PageLoader message="Loading traffic data..." />

  const vehicleData = {
    labels: ['Cars', 'Motorcycles', 'Trucks', 'Buses', 'Auto Rickshaws', 'Others'],
    datasets: [{
      data: [45, 28, 12, 8, 5, 2],
      backgroundColor: ['#2563EB', '#8b5cf6', '#f97316', '#22c55e', '#eab308', '#94a3b8'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }

  const hourlyData = {
    labels: ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'],
    datasets: [{
      label: 'Traffic Volume',
      data: [30, 85, 60, 70, 65, 80, 95, 55, 25],
      backgroundColor: '#2563EBaa',
      borderRadius: 4
    }]
  }

  const chartOptions = (yLabel) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Traffic Incidents" value={stats?.total_traffic_incidents || 0} icon={Car} color="royal" />
        <KPICard title="Congestion Points" value={stats?.congestion_points || 0} icon={AlertTriangle} color="red" />
        <KPICard title="Vehicle Incidents" value={stats?.vehicle_incidents || 0} icon={TrendingUp} color="orange" />
        <KPICard title="Locations Monitored" value={DEMO_TRAFFIC.filter(d => d.latitude).length} icon={MapPin} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Vehicle Classification</h3>
          <p className="text-xs text-slate-400 mb-4">Demo data — requires AI vehicle detection model</p>
          <div className="h-56">
            <Doughnut data={vehicleData} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { font: { size: 11 }, color: '#94a3b8' } } } }} />
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Hourly Traffic Pattern</h3>
          <p className="text-xs text-slate-400 mb-4">Demo data — representative urban traffic curve</p>
          <div className="h-56">
            <Bar data={hourlyData} options={chartOptions('Volume')} />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" /> Detected Traffic & Pedestrian Incidents
        </h3>
        <div className="space-y-2">
          {DEMO_TRAFFIC.map(d => (
            <div key={d.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
              <span className="text-xl">{d.category === 'traffic' ? '🚦' : '🚶'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{d.class_name}</p>
                  <DemoBadge />
                </div>
                <p className="text-xs text-slate-400">{d.location_name}</p>
              </div>
              <SeverityBadge severity={d.severity} />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 italic">
          Note: Real-time vehicle counts and speed analysis require a connected AI model with vehicle tracking capabilities.
        </p>
      </Card>
    </div>
  )
}
