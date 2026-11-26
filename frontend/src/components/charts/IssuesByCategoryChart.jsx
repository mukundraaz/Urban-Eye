import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default function IssuesByCategoryChart({ data }) {
  if (!data) return null
  const chartData = {
    labels: ['Road Damage', 'Traffic Issues', 'Infrastructure', 'Pedestrian Safety'],
    datasets: [{
      data: [
        data.road_damage || 0, data.traffic || 0,
        data.infrastructure || 0, data.pedestrian || 0
      ],
      backgroundColor: ['#ef4444', '#3b82f6', '#8b5cf6', '#f97316'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'right', labels: { padding: 16, font: { size: 12 }, color: '#64748b' } } }
  }
  return <Doughnut data={chartData} options={options} />
}
