import { useState, useEffect } from 'react'
import { ClipboardList, MessageSquare, User, Clock } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { SeverityBadge, StatusBadge, DemoBadge } from '../components/common/Badge.jsx'
import { PageLoader } from '../components/common/LoadingSpinner.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Modal from '../components/common/Modal.jsx'
import { formatDate, formatRelative, capitalize } from '../utils/formatters.js'
import { DEPARTMENTS, STATUS_LABELS } from '../utils/constants.js'
import { DEMO_DETECTIONS } from '../utils/demoData.js'
import { useApp } from '../contexts/AppContext.jsx'
import apiClient from '../api/client.js'
import clsx from 'clsx'

const DEMO_ISSUES = DEMO_DETECTIONS.map((d, i) => ({
  id: i + 1,
  detection_id: d.id,
  title: `${d.class_name} — ${d.location_name || 'Unknown Location'}`,
  description: d.description,
  status: d.status,
  priority: d.severity,
  assigned_to: ['assigned', 'in_progress'].includes(d.status) ? 'Dept. Official' : null,
  department_id: null,
  comments: [],
  created_at: d.created_at,
}))

export default function IssueManagementPage() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const { addNotification } = useApp()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/issues/')
        setIssues(res.data.length > 0 ? res.data : DEMO_ISSUES)
      } catch { setIssues(DEMO_ISSUES) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filteredIssues = statusFilter === 'all' ? issues : issues.filter(i => i.status === statusFilter)

  const updateStatus = async (issueId, status) => {
    try {
      await apiClient.patch(`/issues/${issueId}/status`, { status })
    } catch {}
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
    if (selected?.id === issueId) setSelected(prev => ({ ...prev, status }))
    addNotification(`Status updated to "${capitalize(status)}"`, 'success')
  }

  const addComment = async (issueId) => {
    if (!comment.trim()) return
    const newComment = { user: 'Official', comment, timestamp: new Date().toISOString() }
    try { await apiClient.post(`/issues/${issueId}/comments`, { comment, user: 'Official' }) } catch {}
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, comments: [...(i.comments || []), newComment] } : i))
    if (selected?.id === issueId) setSelected(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }))
    setComment('')
    addNotification('Comment added', 'success')
  }

  if (loading) return <PageLoader message="Loading issues..." />

  const statusCounts = Object.keys(STATUS_LABELS).reduce((acc, s) => ({ ...acc, [s]: issues.filter(i => i.status === s).length }), {})

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter('all')}
          className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all',
            statusFilter === 'all' ? 'bg-navy-900 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50')}>
          All ({issues.length})
        </button>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setStatusFilter(k)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              statusFilter === k ? 'bg-navy-900 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50')}>
            {v} ({statusCounts[k] || 0})
          </button>
        ))}
      </div>

      {filteredIssues.length === 0 ? (
        <Card><EmptyState icon="alert" title="No issues found" description="Detected issues will appear here for management." /></Card>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map(issue => (
            <div key={issue.id} onClick={() => setSelected(issue)}
              className="card p-4 cursor-pointer hover:shadow-card-hover transition-all">
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  issue.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                  issue.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                )}>
                  <ClipboardList size={18} className={clsx(
                    issue.priority === 'critical' ? 'text-red-600' :
                    issue.priority === 'high' ? 'text-orange-600' : 'text-yellow-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{issue.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <SeverityBadge severity={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span>#{issue.id}</span>
                    {issue.assigned_to && <span className="flex items-center gap-1"><User size={10} />{issue.assigned_to}</span>}
                    <span className="flex items-center gap-1"><Clock size={10} />{formatRelative(issue.created_at)}</span>
                    {(issue.comments || []).length > 0 && (
                      <span className="flex items-center gap-1"><MessageSquare size={10} />{issue.comments.length}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Issue Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-2 flex-wrap">
              <SeverityBadge severity={selected.priority} />
              <StatusBadge status={selected.status} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{selected.description || selected.title}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => updateStatus(selected.id, k)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      selected.status === k ? 'bg-royal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    )}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assign To Department</p>
              <div className="flex gap-2">
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="input text-sm flex-1">
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={async () => {
                  if (!assignTo) return
                  try { await apiClient.post(`/issues/${selected.id}/assign`, { assigned_to: assignTo }) } catch {}
                  setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, assigned_to: assignTo, status: 'assigned' } : i))
                  setSelected(prev => ({ ...prev, assigned_to: assignTo, status: 'assigned' }))
                  addNotification(`Assigned to ${assignTo}`, 'success')
                }} disabled={!assignTo} className="btn-primary text-sm">Assign</button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Comments ({(selected.comments || []).length})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {(selected.comments || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No comments yet.</p>
                ) : (
                  (selected.comments || []).map((c, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.user}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment(selected.id)}
                  placeholder="Add a comment..." className="input text-sm flex-1" />
                <button onClick={() => addComment(selected.id)} disabled={!comment.trim()} className="btn-primary text-sm">
                  <MessageSquare size={15} /> Add
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
