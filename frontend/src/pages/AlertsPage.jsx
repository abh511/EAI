import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function AlertsPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    fetchAlerts();
  }, [city, location, navigate]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertsAPI.getActive(city, location);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsAPI.acknowledge(alertId);
      toast.success('Alert acknowledged');
      // Update in place: refetching samples a new reading and would bring the alert back
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a)));
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', text: '#dc2626' },
      high: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' },
      medium: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
      low: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    };
    return colors[severity?.toLowerCase()] || colors.medium;
  };

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((alert) => alert.severity.toLowerCase() === filter);
  }, [alerts, filter]);

  const alertCounts = useMemo(() => {
    return {
      critical: alerts.filter(a => a.severity.toLowerCase() === 'critical').length,
      high: alerts.filter(a => a.severity.toLowerCase() === 'high').length,
      medium: alerts.filter(a => a.severity.toLowerCase() === 'medium').length,
      low: alerts.filter(a => a.severity.toLowerCase() === 'low').length,
    };
  }, [alerts]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#10b981' }}></i>
            <p style={{ color: '#6b7280' }}>Loading alerts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Active Alerts" subtitle={`${location}, ${city}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center" style={{ borderLeft: '4px solid #dc2626' }}>
          <p className="text-sm mb-1" style={{ color: '#6b7280' }}>Critical</p>
          <p className="text-4xl font-bold" style={{ color: '#dc2626' }}>{alertCounts.critical}</p>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #f97316' }}>
          <p className="text-sm mb-1" style={{ color: '#6b7280' }}>High</p>
          <p className="text-4xl font-bold" style={{ color: '#f97316' }}>{alertCounts.high}</p>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #f59e0b' }}>
          <p className="text-sm mb-1" style={{ color: '#6b7280' }}>Medium</p>
          <p className="text-4xl font-bold" style={{ color: '#f59e0b' }}>{alertCounts.medium}</p>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #10b981' }}>
          <p className="text-sm mb-1" style={{ color: '#6b7280' }}>Low</p>
          <p className="text-4xl font-bold" style={{ color: '#10b981' }}>{alertCounts.low}</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <i className="fas fa-filter" style={{ color: '#6b7280' }}></i>
          <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Filter by severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === sev ? '#10b981' : 'transparent',
                color: filter === sev ? '#ffffff' : '#6b7280',
                border: `1px solid ${filter === sev ? '#10b981' : '#e5e7eb'}`
              }}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <i className="fas fa-check-circle text-6xl mb-4" style={{ color: '#10b981' }}></i>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>No Active Alerts</h3>
          <p style={{ color: '#6b7280' }}>All environmental parameters are within safe limits</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const colors = getSeverityColor(alert.severity);
            return (
              <div 
                key={alert.id} 
                className="card"
                style={{ borderLeft: `4px solid ${colors.border}` }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <i 
                        className={`fas ${alert.severity === 'critical' || alert.severity === 'high' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-2xl`}
                        style={{ color: colors.text }}
                      ></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase"
                          style={{ 
                            backgroundColor: colors.bg,
                            color: colors.text,
                            border: `1px solid ${colors.border}`
                          }}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold uppercase" style={{ color: '#9ca3af' }}>
                          {alert.pillar}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
                        {alert.parameter}
                      </h3>
                      <p className="mb-4" style={{ color: '#4b5563' }}>{alert.message}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span style={{ color: '#9ca3af' }}>Observed:</span>
                          <p className="font-semibold" style={{ color: '#111827' }}>{alert.observed_value}</p>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Threshold:</span>
                          <p className="font-semibold" style={{ color: '#111827' }}>{alert.threshold_value}</p>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Authority:</span>
                          <p className="font-semibold text-xs" style={{ color: '#111827' }}>{alert.authority}</p>
                        </div>
                        <div>
                          <span style={{ color: '#9ca3af' }}>Created:</span>
                          <p className="font-semibold text-xs" style={{ color: '#111827' }}>
                            {new Date(alert.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  {alert.status === 'open' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <i className="fas fa-check mr-2"></i>
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
