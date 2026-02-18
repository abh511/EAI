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
  getSummary:  (city, location) => api.get(`/api/dashboard/summary?city=${city}&location=${location}`),
  getPillars:  (city, location) => api.get(`/api/dashboard/pillars?city=${city}&location=${location}`),
  getCityOverview: (city)       => api.get(`/api/dashboard/city-overview?city=${city}`),
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export const alertsAPI = {
  getActive:    (city, location) => api.get(`/api/alerts/active?city=${city}&location=${location}`),
  getHistory:   (city)           => api.get(`/api/alerts/history?city=${city}`),
  acknowledge:  (id)             => api.post(`/api/alerts/${id}/acknowledge`),
}

// ── Forecast ─────────────────────────────────────────────────────────────────
export const forecastAPI = {
  get48hr:  (city, location, pillar = 'air') => api.get(`/api/forecast/48hr/${location}?city=${city}&pillar=${pillar}`),
  getTrend: (city, location, pillar) => api.get(`/api/forecast/trend/${pillar}?city=${city}&location=${location}`),
}

// ── Locations ─────────────────────────────────────────────────────────────────
export const locationsAPI = {
  list:   ()      => api.get('/api/locations/list'),
  byCity: (city)  => api.get(`/api/locations/${city}`),
}

// ── Grievance ─────────────────────────────────────────────────────────────────
export const grievanceAPI = {
  submit:    (data) => api.post('/api/grievance/submit', data),
  getStatus: (id)   => api.get(`/api/grievance/status/${id}`),
}

export default api
