import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const CitySelectPage = lazy(() => import('./pages/CitySelectPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const ForecastPage = lazy(() => import('./pages/ForecastPage.jsx'))
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'))
const GrievancePage = lazy(() => import('./pages/GrievancePage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const SimulatorPage = lazy(() => import('./pages/SimulatorPage.jsx'))
const ImageSimulatorPage = lazy(() => import('./pages/ImageSimulatorPage.jsx'))
const SiteAnalyzerPage = lazy(() => import('./pages/SiteAnalyzerPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))

// Components
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#10b981' }}></i>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  </div>
)

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
            duration: 3000,
            style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/select-city" element={<ProtectedRoute><CitySelectPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/forecast" element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/grievance" element={<ProtectedRoute><GrievancePage /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
            <Route path="/image-simulator" element={<ProtectedRoute><ImageSimulatorPage /></ProtectedRoute>} />
            <Route path="/site-analyzer" element={<ProtectedRoute><SiteAnalyzerPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  )
}
