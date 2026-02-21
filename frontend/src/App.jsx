import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages — create these files one by one
import LoginPage       from './pages/LoginPage.jsx'
import HomePage        from './pages/HomePage.jsx'
import CitySelectPage  from './pages/CitySelectPage.jsx'
import DashboardPage   from './pages/DashboardPage.jsx'
import MapPage         from './pages/MapPage.jsx'
import ForecastPage    from './pages/ForecastPage.jsx'
import AlertsPage      from './pages/AlertsPage.jsx'
import GrievancePage   from './pages/GrievancePage.jsx'
import NotFoundPage    from './pages/NotFoundPage.jsx'
import SimulatorPage   from './pages/SimulatorPage.jsx'
import SiteAnalyzerPage from './pages/SiteAnalyzerPage.jsx'

// Components
import ErrorBoundary  from './components/ui/ErrorBoundary.jsx'

// Auth guard (replace with real Supabase session check)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('ew_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<LoginPage />} />

          {/* Protected */}
          <Route path="/home"           element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/select-city"    element={<ProtectedRoute><CitySelectPage /></ProtectedRoute>} />
          <Route path="/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/map"            element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/forecast"       element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} />
          <Route path="/alerts"         element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          <Route path="/grievance"      element={<ProtectedRoute><GrievancePage /></ProtectedRoute>} />
          <Route path="/simulator"      element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
          <Route path="/site-analyzer"  element={<ProtectedRoute><SiteAnalyzerPage /></ProtectedRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  )
}
