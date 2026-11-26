import { format, formatDistanceToNow } from 'date-fns'

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try { return format(new Date(dateStr), 'dd MMM yyyy, HH:mm') } catch { return dateStr }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return 'N/A'
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export const formatConfidence = (val) => {
  if (val == null) return 'N/A'
  return `${(val * 100).toFixed(1)}%`
}

export const formatFileSize = (mb) => {
  if (!mb) return 'N/A'
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
}

export const formatTimestamp = (secs) => {
  if (secs == null) return 'N/A'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatDistance = (meters) => {
  if (!meters) return 'N/A'
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

export const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : ''
