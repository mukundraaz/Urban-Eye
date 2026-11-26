import { useState } from 'react'
import { FileBarChart, Download, Table } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import { formatDate, formatConfidence } from '../utils/formatters.js'
import { useApp } from '../contexts/AppContext.jsx'
import apiClient from '../api/client.js'
import clsx from 'clsx'

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false)
  const [reportType, setReportType] = useState('csv')
  const [severityFilter, setSeverityFilter] = useState('all')
  const { addNotification } = useApp()

  const getFilteredDetections = () =>
    DEMO_DETECTIONS.filter(d => severityFilter === 'all' || d.severity === severityFilter)

  const downloadCSV = async () => {
    setGenerating(true)
    try {
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.append('severity', severityFilter)
      try {
        const res = await apiClient.get('/reports/csv?' + params.toString(), { responseType: 'blob' })
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a'); a.href = url; a.download = 'urbaneye_detections.csv'; a.click()
        URL.revokeObjectURL(url)
        addNotification('CSV report downloaded', 'success')
      } catch {
        const detections = getFilteredDetections()
        const headers = ['Detection ID','Class','Category','Severity','Confidence','Latitude','Longitude','Location','Status','Is Demo','Detected At']
        const rows = detections.map(d => [
          d.detection_id, d.class_name, d.category, d.severity,
          formatConfidence(d.confidence), d.latitude || '', d.longitude || '',
          `"${d.location_name || ''}"`, d.status, d.is_demo, formatDate(d.created_at)
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
        const a = document.createElement('a'); a.href = url; a.download = 'urbaneye_demo_report.csv'; a.click()
        URL.revokeObjectURL(url)
        addNotification('Demo CSV report downloaded', 'success')
      }
    } finally { setGenerating(false) }
  }

  const exportJSON = () => {
    const detections = getFilteredDetections()
    const report = {
      generated_at: new Date().toISOString(),
      mode: 'demo',
      total: detections.length,
      filters: { severity: severityFilter },
      detections
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'urbaneye_report.json'; a.click()
    URL.revokeObjectURL(url)
    addNotification('JSON report downloaded', 'success')
  }

  const filtered = getFilteredDetections()

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Detections', value: DEMO_DETECTIONS.length },
          { label: 'Critical Issues', value: DEMO_DETECTIONS.filter(d => d.severity === 'critical').length, color: 'text-red-600' },
          { label: 'With GPS Data', value: DEMO_DETECTIONS.filter(d => d.latitude).length, color: 'text-green-600' },
          { label: 'Resolved', value: DEMO_DETECTIONS.filter(d => d.status === 'resolved').length, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <p className={clsx('text-2xl font-bold', s.color || 'text-slate-900 dark:text-white')}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Report generator */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FileBarChart size={18} className="text-royal-600" /> Generate Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Severity Filter</label>
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="input text-sm">
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Export Format</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="input text-sm">
              <option value="csv">CSV Spreadsheet</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
        </div>
        <button
          onClick={reportType === 'csv' ? downloadCSV : exportJSON}
          disabled={generating}
          className="btn-primary py-2.5 px-6 text-sm font-semibold">
          <Download size={16} />
          {generating ? 'Generating...' : `Download ${reportType.toUpperCase()} (${filtered.length} records)`}
        </button>
      </Card>

      {/* Preview table */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Table size={16} className="text-royal-600" /> Preview — {filtered.length} Detections
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Detection ID','Class','Category','Severity','Confidence','Location','Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-2 px-3 font-mono text-slate-500">{d.detection_id}</td>
                  <td className="py-2 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{d.class_name}</td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">{d.category.replace('_', ' ')}</td>
                  <td className="py-2 px-3 capitalize">
                    <span className={clsx('font-semibold',
                      d.severity === 'critical' ? 'text-red-600' : d.severity === 'high' ? 'text-orange-600' :
                      d.severity === 'medium' ? 'text-yellow-600' : 'text-green-600')}>
                      {d.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{formatConfidence(d.confidence)}</td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-40 truncate">{d.location_name || 'N/A'}</td>
                  <td className="py-2 px-3 capitalize text-slate-600 dark:text-slate-400">{d.status.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
