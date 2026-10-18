import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, mlAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const PILLAR_ICONS = {
  air: 'fas fa-wind',
  water: 'fas fa-tint',
  noise: 'fas fa-volume-up',
  industrial: 'fas fa-industry',
  waste: 'fas fa-trash',
  heat: 'fas fa-thermometer-half',
  groundwater: 'fas fa-water',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getSummary(city, location);
      setData(response.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [city, location]);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await dashboardAPI.getAIInsights(city, location);
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  }, [city, location]);

  const fetchMLPrediction = useCallback(async () => {
    try {
      const response = await mlAPI.predictRisk(city, location);
      setMlPrediction(response.data);
    } catch (error) {
      console.error('Failed to load ML prediction:', error);
    }
  }, [city, location]);

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    // Fetch all data in parallel
    Promise.all([fetchData(), fetchInsights(), fetchMLPrediction()]);
  }, [city, location, navigate, fetchData, fetchInsights, fetchMLPrediction]);

  const getStatusColor = useCallback((status) => {
    const colors = {
      good: '#10b981',
      moderate: '#f59e0b',
      unhealthy: '#f97316',
      critical: '#dc2626',
    };
    return colors[status] || colors.moderate;
  }, []);

  const getAQIColor = useCallback((aqi) => {
    if (aqi <= 50) return { bg: '#10b981', label: 'Good' }; // Green
    if (aqi <= 100) return { bg: '#f59e0b', label: 'Moderate' }; // Yellow
    if (aqi <= 150) return { bg: '#f97316', label: 'Unhealthy for Sensitive' }; // Orange
    if (aqi <= 200) return { bg: '#dc2626', label: 'Unhealthy' }; // Red
    if (aqi <= 300) return { bg: '#9333ea', label: 'Very Unhealthy' }; // Purple
    return { bg: '#7f1d1d', label: 'Hazardous' }; // Dark Red
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#10b981' }}></i>
            <p style={{ color: '#8390A2' }}>Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl mb-4" style={{ color: '#f59e0b' }}></i>
            <p style={{ color: '#8390A2' }}>No data available</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle={`${location}, ${city} • ${data.zone_type}`}>
      {/* AQI Hero Card */}
      <div className="card mb-6" style={{ 
        background: `linear-gradient(135deg, ${getAQIColor(data.aqi).bg} 0%, ${getAQIColor(data.aqi).bg}dd 100%)`, 
        color: 'white' 
      }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-2 opacity-90">Air Quality Index</p>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-bold">{data.aqi}</span>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white bg-opacity-20">
                {getAQIColor(data.aqi).label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm mb-2 opacity-90">Overall Risk</p>
            <span className="inline-block px-6 py-3 rounded-lg text-lg font-bold uppercase bg-white bg-opacity-20">
              {data.overall_risk}
            </span>
          </div>
        </div>
        {data.active_alerts > 0 && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-20 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span className="font-medium">{data.active_alerts} active alert{data.active_alerts !== 1 ? 's' : ''}</span>
            <button
              onClick={() => navigate('/alerts')}
              className="ml-auto text-sm hover:underline"
            >
              View All →
            </button>
          </div>
        )}
      </div>

      {/* ML Risk Prediction */}
      {mlPrediction && (
        <div className="card mb-6" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <i className="fas fa-brain text-2xl" style={{ color: '#10b981' }}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#333' }}>AI Risk Forecast</h3>
              <p className="text-xs" style={{ color: '#8390A2' }}>
                Average risk over the next {mlPrediction.horizon_hours || 3} hours
                {mlPrediction.current_risk_level && ` · Current: ${mlPrediction.current_risk_level} (AQI ${mlPrediction.current_aqi})`}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Level */}
            <div className="p-4 rounded-lg" style={{ 
              backgroundColor: mlPrediction.risk_level === 'Critical' ? 'rgba(220, 38, 38, 0.1)' :
                             mlPrediction.risk_level === 'High' ? 'rgba(249, 115, 22, 0.1)' :
                             mlPrediction.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.1)' :
                             'rgba(16, 185, 129, 0.1)',
              borderLeft: `4px solid ${
                mlPrediction.risk_level === 'Critical' ? '#dc2626' :
                mlPrediction.risk_level === 'High' ? '#f97316' :
                mlPrediction.risk_level === 'Medium' ? '#f59e0b' :
                '#10b981'
              }`
            }}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8390A2' }}>Forecast Risk Level</p>
              <p className="text-3xl font-bold" style={{ 
                color: mlPrediction.risk_level === 'Critical' ? '#dc2626' :
                       mlPrediction.risk_level === 'High' ? '#f97316' :
                       mlPrediction.risk_level === 'Medium' ? '#f59e0b' :
                       '#10b981'
              }}>
                {mlPrediction.risk_level}
              </p>
              {mlPrediction.safety_override && (
                <p className="text-xs mt-1" style={{ color: '#dc2626' }}>
                  Air is hazardous right now, so the forecast is set to Critical.
                </p>
              )}
            </div>

            {/* Confidence */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f6f5f7' }}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8390A2' }}>Confidence</p>
              <p className="text-3xl font-bold" style={{ color: '#333' }}>
                {(mlPrediction.confidence * 100).toFixed(1)}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${mlPrediction.confidence * 100}%`,
                    background: 'linear-gradient(90deg, #FF4B2B 0%, #FF416C 100%)'
                  }}
                ></div>
              </div>
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f6f5f7' }}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8390A2' }}>Status</p>
              <p className="text-lg font-bold" style={{ color: '#333' }}>
                {mlPrediction.risk_level === 'Low' ? '✓ Safe' : 
                 mlPrediction.risk_level === 'Medium' ? '⚠ Monitor' :
                 mlPrediction.risk_level === 'High' ? '⚠ Alert' :
                 '🚨 Critical'}
              </p>
            </div>
          </div>

          {/* Probability Distribution */}
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#f6f5f7' }}>
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: '#8390A2' }}>Risk Probability Distribution</p>
            <div className="space-y-2">
              {Object.entries(mlPrediction.probabilities).map(([level, prob]) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20" style={{ color: '#333' }}>{level}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all" 
                      style={{ 
                        width: `${prob * 100}%`,
                        backgroundColor: level === 'Critical' ? '#dc2626' :
                                       level === 'High' ? '#f97316' :
                                       level === 'Medium' ? '#f59e0b' :
                                       '#10b981'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono w-16 text-right" style={{ color: '#555' }}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights && (
        <div className="card mb-6" style={{ borderLeft: '4px solid #b700ff' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(183, 0, 255, 0.1)' }}>
              <i className="fas fa-robot text-2xl" style={{ color: '#b700ff' }}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#333' }}>AI Insights & Recommendations</h3>
              <p className="text-xs" style={{ color: '#8390A2' }}>Confidence: {(insights.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
          
          {insights.summary && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#f6f5f7' }}>
              <p className="text-sm" style={{ color: '#555' }}>{insights.summary}</p>
            </div>
          )}

          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: '#8390A2' }}>Top Recommendations:</p>
              {insights.recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: rec.priority === 'critical' ? 'rgba(220, 38, 38, 0.1)' :
                                   rec.priority === 'high' ? 'rgba(249, 115, 22, 0.1)' :
                                   'rgba(245, 158, 11, 0.1)',
                    borderLeft: `4px solid ${
                      rec.priority === 'critical' ? '#dc2626' :
                      rec.priority === 'high' ? '#f97316' :
                      '#f59e0b'
                    }`,
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: '#333' }}>{rec.action}</span>
                    <span className="text-xs px-2 py-0.5 rounded uppercase font-semibold" style={{
                      backgroundColor: rec.priority === 'critical' ? 'rgba(220, 38, 38, 0.2)' :
                                     rec.priority === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                                     'rgba(245, 158, 11, 0.2)',
                      color: rec.priority === 'critical' ? '#dc2626' :
                            rec.priority === 'high' ? '#f97316' :
                            '#f59e0b',
                    }}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#555' }}>{rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7 Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.pillars.map((pillar) => {
          const iconClass = PILLAR_ICONS[pillar.pillar] || 'fas fa-wind';
          return (
            <div key={pillar.pillar} className="card-single">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h1 className="text-4xl font-bold" style={{ color: '#333' }}>{pillar.value}</h1>
                  {pillar.unit && (
                    <span className="text-sm font-medium" style={{ color: '#8390A2' }}>{pillar.unit}</span>
                  )}
                </div>
                <span className="text-sm" style={{ color: '#8390A2' }}>{pillar.label}</span>
                <div className="mt-2">
                  <span 
                    className="inline-block px-3 py-1 rounded-md text-xs font-semibold uppercase"
                    style={{
                      backgroundColor: `${getStatusColor(pillar.status)}20`,
                      color: getStatusColor(pillar.status),
                    }}
                  >
                    {pillar.status}
                  </span>
                </div>
              </div>
              <div>
                <i className={`${iconClass} text-5xl`} style={{ color: '#10b981' }}></i>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="mt-8">
        <div className="card">
          <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <h3 className="text-lg font-bold" style={{ color: '#333' }}>Environmental Parameters</h3>
            <button 
              onClick={() => navigate('/forecast')}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '11px' }}
            >
              View Forecast <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <td>Parameter</td>
                  <td>Current Value</td>
                  <td>Status</td>
                  <td>Trend</td>
                </tr>
              </thead>
              <tbody>
                {data.pillars.slice(0, 5).map((pillar, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{pillar.label}</td>
                    <td>{pillar.value} {pillar.unit}</td>
                    <td>
                      <span className="status" style={{ backgroundColor: getStatusColor(pillar.status) }}></span>
                      {pillar.status}
                    </td>
                    <td>
                      {pillar.trend === 'up' && <i className="fas fa-arrow-up text-red-500"></i>}
                      {pillar.trend === 'down' && <i className="fas fa-arrow-down text-green-500"></i>}
                      {pillar.trend === 'stable' && <i className="fas fa-minus text-gray-500"></i>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm" style={{ color: '#8390A2' }}>
        Last updated: {new Date(data.last_updated).toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short'
        })} IST
      </div>
    </Layout>
  );
}
