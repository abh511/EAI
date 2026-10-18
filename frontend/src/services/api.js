/**
 * EnviroWatch AI — API Service Layer
 * All calls go through this file. Swap base URL via .env
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ew_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message
    return Promise.reject(new Error(msg))
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password)     => api.post('/api/auth/login',    { email, password }),
  register: (email, password, full_name) => api.post('/api/auth/register', { email, password, full_name }),
  logout:   ()                    => api.post('/api/auth/logout'),
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary:  (city, location) => api.get('/api/dashboard/summary', { params: { city, location } }),
  getPillars:  (city, location) => api.get('/api/dashboard/pillars', { params: { city, location } }),
  getCityOverview: (city)       => api.get('/api/dashboard/city-overview', { params: { city } }),
  getAIInsights: (city, location) => api.get('/api/dashboard/ai-insights', { params: { city, location } }),
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export const alertsAPI = {
  getActive:    (city, location) => api.get('/api/alerts/active', { params: { city, location } }),
  getHistory:   (city)           => api.get('/api/alerts/history', { params: { city } }),
  acknowledge:  (id)             => api.post(`/api/alerts/${encodeURIComponent(id)}/acknowledge`),
}

// ── Forecast ─────────────────────────────────────────────────────────────────
export const forecastAPI = {
  get48hr:  (city, location, pillar = 'air') => api.get(`/api/forecast/48hr/${encodeURIComponent(location)}`, { params: { city, pillar } }),
  getTrend: (city, location, pillar) => api.get(`/api/forecast/trend/${encodeURIComponent(pillar)}`, { params: { city, location } }),
}

// ── Locations ─────────────────────────────────────────────────────────────────
export const locationsAPI = {
  list:   ()      => api.get('/api/locations/list'),
  byCity: (city)  => api.get(`/api/locations/${encodeURIComponent(city)}`),
}

// ── Grievance ─────────────────────────────────────────────────────────────────
export const grievanceAPI = {
  submit:    (data) => api.post('/api/grievance/submit', data),
  getStatus: (id)   => api.get(`/api/grievance/status/${encodeURIComponent(id)}`),
}

// ── Simulation ────────────────────────────────────────────────────────────────
export const simulationAPI = {
  predictImpact: (city, location, scenario) =>
    api.post('/api/simulation/predict-impact', null, { params: { city, location, ...scenario } }),
}

// ── Machine Learning ──────────────────────────────────────────────────────────
export const mlAPI = {
  predictRisk:   (city, location) => api.get('/api/ml/predict-risk', { params: { city, location } }),
  detectAnomaly: (city, location) => api.get('/api/ml/detect-anomaly', { params: { city, location } }),
}

export default api
