import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import Layout from './components/layout/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import VideoUploadPage from './pages/VideoUploadPage.jsx'
import DetectionResultsPage from './pages/DetectionResultsPage.jsx'
import MapPage from './pages/MapPage.jsx'
import NearbyIssuesPage from './pages/NearbyIssuesPage.jsx'
import RecommendationsPage from './pages/RecommendationsPage.jsx'
import IssueManagementPage from './pages/IssueManagementPage.jsx'
import TrafficIntelligencePage from './pages/TrafficIntelligencePage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="upload" element={<VideoUploadPage />} />
        <Route path="detections" element={<DetectionResultsPage />} />
        <Route path="detections/:videoId" element={<DetectionResultsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="nearby" element={<NearbyIssuesPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="issues" element={<IssueManagementPage />} />
        <Route path="traffic" element={<TrafficIntelligencePage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
