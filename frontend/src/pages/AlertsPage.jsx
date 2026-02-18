import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';

export default function AlertsPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    fetchAlerts();
  }, [city, location]);

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
      fetchAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[severity?.toLowerCase()] || colors.medium;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Clock className="w-5 h-5" />;
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.severity.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Active Alerts</h1>
              <p className="text-sm text-gray-400">{location}, {city}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{filteredAlerts.length} alerts</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm font-medium">Filter by severity:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  filter === sev
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {sev.charAt(0).toUpperCase() + sev.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Alerts</h3>
            <p className="text-gray-400">All environmental parameters are within safe limits</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="card-hover">
                <div className="flex items-start gap-4">
                  {/* Severity Badge */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">{alert.pillar}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{alert.parameter}</h3>
                      </div>
                      {alert.status === 'open' && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="btn-secondary text-xs flex-shrink-0"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>

                    <p className="text-gray-300 mb-3">{alert.message}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Observed:</span>
                        <p className="text-white font-semibold">{alert.observed_value}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Threshold:</span>
                        <p className="text-white font-semibold">{alert.threshold_value}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Authority:</span>
                        <p className="text-white font-semibold text-xs">{alert.authority}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <p className="text-white font-semibold text-xs">
                          {new Date(alert.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {['critical', 'high', 'medium', 'low'].map((sev) => {
            const count = alerts.filter(a => a.severity.toLowerCase() === sev).length;
            return (
              <div key={sev} className="card text-center">
                <p className="text-gray-400 text-sm mb-1 capitalize">{sev}</p>
                <p className={`text-3xl font-bold ${getSeverityColor(sev).split(' ')[1]}`}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
