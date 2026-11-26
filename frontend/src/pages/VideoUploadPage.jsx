import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, Video, X, CheckCircle, AlertCircle, MapPin, Cpu, FileVideo, Clock } from 'lucide-react'
import Card from '../components/common/Card.jsx'
import { ProgressBar } from '../components/common/LoadingSpinner.jsx'
import { formatFileSize } from '../utils/formatters.js'
import { useApp } from '../contexts/AppContext.jsx'
import apiClient from '../api/client.js'
import clsx from 'clsx'

export default function VideoUploadPage() {
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [baseLat, setBaseLat] = useState('')
  const [baseLon, setBaseLon] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState(null)
  const [error, setError] = useState('')
  const { addNotification } = useApp()
  const navigate = useNavigate()
  const pollRef = useRef(null)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) { setError('Please upload a valid video file (MP4, MOV, AVI).'); return }
    const f = accepted[0]
    if (f.size > 500 * 1024 * 1024) { setError('File size exceeds 500 MB limit.'); return }
    setFile(f)
    setVideoUrl(URL.createObjectURL(f))
    setError('')
    setUploadedVideo(null)
    setAnalysisStatus(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/x-msvideo': ['.avi'] },
    maxFiles: 1
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      if (locationName) form.append('location_name', locationName)
      if (baseLat) form.append('base_latitude', baseLat)
      if (baseLon) form.append('base_longitude', baseLon)

      const fakeProgress = setInterval(() => setUploadProgress(p => Math.min(p + 12, 85)), 300)
      const res = await apiClient.post('/videos/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      clearInterval(fakeProgress)
      setUploadProgress(100)
      setUploadedVideo(res.data)
      addNotification('Video uploaded! AI analysis started.', 'success')
      pollAnalysis(res.data.id)
    } catch (err) {
      setUploadProgress(0)
      const errorMsg = err.response?.data?.detail || err.message || 'Upload failed. Please ensure backend server is running.'
      setError(errorMsg)
      addNotification(`Upload failed: ${errorMsg}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const pollAnalysis = (videoId) => {
    setAnalyzing(true)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await apiClient.get(`/videos/${videoId}/status`)
        setAnalysisStatus(res.data)
        if (res.data.status === 'completed' || res.data.status === 'failed' || attempts > 60) {
          clearInterval(pollRef.current)
          setAnalyzing(false)
          if (res.data.status === 'completed') addNotification('Analysis complete!', 'success')
        }
      } catch { clearInterval(pollRef.current); setAnalyzing(false) }
    }, 2000)
  }

  const removeFile = () => {
    setFile(null); setVideoUrl(null); setUploadedVideo(null)
    setAnalysisStatus(null); setUploadProgress(0)
    if (pollRef.current) clearInterval(pollRef.current)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upload Zone */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <FileVideo size={18} className="text-royal-600" /> Select Video File
        </h2>
        {!file ? (
          <div {...getRootProps()} className={clsx(
            'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
            isDragActive ? 'border-royal-500 bg-royal-50 dark:bg-royal-900/20' :
              'border-slate-200 dark:border-slate-600 hover:border-royal-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          )}>
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-royal-50 dark:bg-royal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="text-royal-600" size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">or <span className="text-royal-600 font-medium">browse files</span></p>
            <p className="text-xs text-slate-400 mt-3">MP4, MOV, AVI • Max 500 MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="w-12 h-12 bg-royal-100 dark:bg-royal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video className="text-royal-600" size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(file.size / (1024 * 1024))}</p>
              </div>
              {!uploadedVideo && (
                <button onClick={removeFile} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
            {videoUrl && <video src={videoUrl} controls className="w-full rounded-xl max-h-64 bg-black" />}
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />{error}
          </div>
        )}
      </Card>

      {/* Location */}
      <Card>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-royal-600" /> Location Information
          <span className="text-xs text-slate-400 font-normal">(Optional — for GPS map placement)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location Name</label>
            <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)}
              className="input" placeholder="e.g. Shivajinagar, Pune" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Base Latitude</label>
            <input type="number" step="any" value={baseLat} onChange={e => setBaseLat(e.target.value)}
              className="input" placeholder="e.g. 18.5204" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Base Longitude</label>
            <input type="number" step="any" value={baseLon} onChange={e => setBaseLon(e.target.value)}
              className="input" placeholder="e.g. 73.8567" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          📍 Provide GPS coordinates of the recording start point for accurate map placement.
          Without GPS, demo coordinates will be used in demo mode.
        </p>
      </Card>

      {/* Upload Progress */}
      {(uploading || uploadProgress > 0) && (
        <Card>
          <ProgressBar
            value={uploadProgress}
            label={uploading ? 'Uploading video...' : 'Upload complete'}
            color={uploadProgress === 100 ? 'green' : 'royal'}
          />
        </Card>
      )}

      {/* Analysis Status */}
      {(analyzing || analysisStatus) && (
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu size={18} className="text-royal-600" /> AI Analysis Status
          </h2>
          {analyzing && (
            <div className="space-y-3">
              <ProgressBar value={analysisStatus?.progress || 50} label="Processing video frames..." />
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Clock size={14} className="animate-pulse text-royal-500" />
                AI is analyzing frames for road defects, traffic issues, and infrastructure problems...
              </p>
            </div>
          )}
          {analysisStatus?.status === 'completed' && (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle size={20} />
              <div>
                <p className="font-semibold">Analysis Complete!</p>
                <p className="text-sm text-slate-500">AI detection finished. View results on the Detections page.</p>
              </div>
            </div>
          )}
          {analysisStatus?.status === 'failed' && (
            <div className="flex flex-col gap-1.5 text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <p className="font-semibold text-sm">Analysis failed. Please try again or check server logs.</p>
              </div>
              {analysisStatus?.error_message && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-2.5 rounded-lg mt-1 font-mono">
                  {analysisStatus.error_message}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!uploadedVideo ? (
          <button onClick={handleUpload} disabled={!file || uploading}
            className="btn-primary py-3 px-8 text-sm font-semibold">
            <Cpu size={16} />
            {uploading ? 'Uploading...' : 'Upload & Start Analysis'}
          </button>
        ) : (
          <button onClick={() => navigate(uploadedVideo.id !== 1 ? `/detections/${uploadedVideo.id}` : '/detections')}
            className="btn-primary py-3 px-8 text-sm font-semibold">
            <CheckCircle size={16} /> View Detection Results
          </button>
        )}
        {file && !uploading && (
          <button onClick={removeFile} className="btn-secondary py-3 px-6 text-sm">
            <X size={16} /> Clear
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
          ⚡ Real AI Road Damage Detection Active (YOLO11 • RDD2022)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          {[
            'D40: Potholes (Critical)',
            'D00: Longitudinal Cracks',
            'D10: Transverse Cracks',
            'D20: Alligator Cracks',
            'OpenCV Video Frame Extraction',
            'IoU Event Deduplication',
            'GPS Telemetry Synchronization',
            'Automated Repair Recommendations'
          ].map(c => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />{c}
            </div>
          ))}
        </div>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
          ✅ Connected to custom Ultralytics YOLO model (<code className="bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded">models/best.pt</code>). Real bounding boxes and damage classifications will be generated.
        </p>
      </div>
    </div>
  )
}
