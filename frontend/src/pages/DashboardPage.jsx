import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { 
  Wind, Droplets, Volume2, Factory, Trash2, Thermometer, Layers,
  TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, MapPin, LogOut
} from 'lucide-react';

const PILLAR_ICONS = {
  air: Wind,
  water: Droplets,
  noise: Volume2,
  industrial: Factory,
  waste: Trash2,
  heat: Thermometer,
  groundwater: Layers,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { city, location, clearUser } = useAppStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    fetchData();
  }, [city, location]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getSummary(city, location);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      good: 'text-green-400 bg-green-500/20 border-green-500/30',
      moderate: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      unhealthy: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      critical: 'text-red-400 bg-red-500/20 border-red-500/30',
    };
    return colors[status] || colors.moderate;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/select-city')}
                className="btn-ghost"
              >
                <MapPin className="w-4 h-4" />
                Change Location
              </button>
              <div className="h-6 w-px bg-gray-700"></div>
              <div>
                <h1 className="text-xl font-bold text-white">{location}</h1>
                <p className="text-sm text-gray-400">{city} • {data.zone_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="btn-ghost">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AQI Hero Card */}
        <div className="card mb-8 bg-gradient-to-br from-brand-900/50 to-gray-900 border-brand-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Air Quality Index</p>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-bold text-white">{data.aqi}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(data.overall_risk)}`}>
                  {data.aqi_category}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Overall Risk</p>
              <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold uppercase ${getStatusColor(data.overall_risk)}`}>
                {data.overall_risk}
              </span>
            </div>
          </div>
          {data.active_alerts > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{data.active_alerts} active alert{data.active_alerts !== 1 ? 's' : ''}</span>
              <button
                onClick={() => navigate('/alerts')}
                className="ml-auto text-sm text-brand-400 hover:text-brand-300"
              >
                View All →
              </button>
            </div>
          )}
        </div>

        {/* Navigation Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Dashboard
          </button>
          <button onClick={() => navigate('/map')} className="btn-secondary">
            Map View
          </button>
          <button onClick={() => navigate('/forecast')} className="btn-secondary">
            48hr Forecast
          </button>
          <button onClick={() => navigate('/alerts')} className="btn-secondary">
            Alerts
          </button>
          <button onClick={() => navigate('/grievance')} className="btn-secondary">
            Report Issue
          </button>
        </div>

        {/* 7 Pillar Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.pillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.pillar] || Wind;
            return (
              <div key={pillar.pillar} className="card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-pillar-${pillar.pillar}/20 group-hover:bg-pillar-${pillar.pillar}/30 transition-colors`}>
                    <Icon className={`w-6 h-6 text-pillar-${pillar.pillar}`} />
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    {getTrendIcon(pillar.trend)}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">{pillar.label}</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{pillar.value}</span>
                  <span className="text-sm text-gray-500">{pillar.unit}</span>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold mb-2 ${getStatusColor(pillar.status)}`}>
                  {pillar.status.toUpperCase()}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{pillar.description}</p>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: {new Date(data.last_updated).toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
          })} IST
        </div>
      </div>
    </div>
  );
}
