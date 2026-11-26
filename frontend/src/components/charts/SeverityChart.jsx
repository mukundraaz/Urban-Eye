import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function SeverityChart({ data }) {
  if (!data) return null
  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      label: 'Detections',
      data: [data.critical || 0, data.high || 0, data.medium || 0, data.low || 0],
      backgroundColor: ['#ef4444cc', '#f97316cc', '#eab308cc', '#22c55ecc'],
      borderRadius: 6,
    }]
  }
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
               x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } } }
  }
  return <Bar data={chartData} options={options} />
}
