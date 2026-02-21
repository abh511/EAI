import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forecastAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeft, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

const PILLARS = [
  { value: 'air', label: 'Air Quality' },
  { value: 'water', label: 'Water Quality' },
  { value: 'noise', label: 'Noise Level' },
  { value: 'industrial', label: 'Industrial Emissions' },
  { value: 'heat', label: 'Urban Heat' },
  { value: 'groundwater', label: 'Groundwater' },
  { value: 'waste', label: 'Solid Waste' },
];

export default function ForecastPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [selectedPillar, setSelectedPillar] = useState('air');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    fetchForecast();
  }, [city, location, selectedPillar]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await forecastAPI.get48hr(city, location, selectedPillar);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!data?.points) return [];
    return data.points.map((point) => ({
      time: new Date(point.time).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      value: point.value,
      threshold: data.threshold,
      breach: point.will_breach,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4 neon-glow" />
          <p className="text-gray-300">Loading forecast...</p>
        </div>
      </div>
    );
  }

  const chartData = formatChartData();
  const breachCount = data?.points?.filter(p => p.will_breach).length || 0;

  return (
    <div className="min-h-screen animated-gradient">
      {/* Floating Particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      
      {/* Header */}
      <div className="glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-gradient">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold gradient-text neon-glow">48-Hour Forecast</h1>
              <p className="text-sm text-gray-300">{location}, {city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pillar Selector */}
        <div className="mb-6">
          <label className="label mb-2 text-gray-300">Select Environmental Pillar</label>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((pillar) => (
              <button
                key={pillar.value}
                onClick={() => setSelectedPillar(pillar.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPillar === pillar.value
                    ? 'btn-gradient neon-glow'
                    : 'glass-card text-gray-300 hover:border-brand-400'
                }`}
              >
                {pillar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        {data && (
          <div className={`glass-card card-hover mb-6 border-2 ${breachCount > 0 ? 'border-yellow-500/50' : 'border-green-500/50 neon-glow'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${breachCount > 0 ? 'bg-yellow-500/20' : 'bg-green-500/20'} floating`}>
                {breachCount > 0 ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-400 pulse" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold gradient-text mb-2">{data.parameter} Forecast</h3>
                <p className="text-gray-200 mb-3">{data.summary}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">Threshold: </span>
                    <span className="text-white font-semibold">{data.threshold} {data.unit}</span>
                  </div>
                  {data.peak_risk_time && (
                    <div>
                      <span className="text-gray-300">Peak Risk: </span>
                      <span className="text-white font-semibold">
                        {new Date(data.peak_risk_time).toLocaleString('en-IN', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-300">Breach Hours: </span>
                    <span className={`font-semibold ${breachCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {breachCount} / 48
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="glass-card card-hover">
          <h3 className="text-lg font-semibold gradient-text mb-4">
            {data?.parameter} Levels - Next 48 Hours
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#d1d5db"
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                interval={5}
              />
              <YAxis 
                stroke="#d1d5db"
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                label={{ value: data?.unit || '', angle: -90, position: 'insideLeft', fill: '#d1d5db' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f3f4f6',
                  backdropFilter: 'blur(10px)',
                }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Legend 
                wrapperStyle={{ color: '#d1d5db' }}
              />
              <ReferenceLine 
                y={data?.threshold} 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                label={{ value: 'Threshold', fill: '#f59e0b', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#667eea"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={payload.breach ? '#ef4444' : '#667eea'}
                      stroke={payload.breach ? '#dc2626' : '#764ba2'}
                      strokeWidth={2}
                    />
                  );
                }}
                name={data?.parameter || 'Value'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Data Points Summary */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="glass-card card-hover text-center">
            <p className="text-gray-300 text-sm mb-1">Current Value</p>
            <p className="text-4xl font-bold gradient-text neon-glow">
              {data?.points?.[0]?.value ? data.points[0].value.toFixed(1) : '0.0'}
            </p>
            <p className="text-gray-400 text-sm">{data?.unit || ''}</p>
          </div>
          <div className="glass-card card-hover text-center">
            <p className="text-gray-300 text-sm mb-1">Average (48hr)</p>
            <p className="text-4xl font-bold gradient-text neon-glow">
              {data?.points?.length > 0
                ? (data.points.reduce((sum, p) => sum + p.value, 0) / data.points.length).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-gray-400 text-sm">{data?.unit || ''}</p>
          </div>
          <div className="glass-card card-hover text-center">
            <p className="text-gray-300 text-sm mb-1">Peak Value</p>
            <p className="text-4xl font-bold gradient-text neon-glow">
              {data?.points?.length > 0
                ? Math.max(...data.points.map(p => p.value)).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-gray-400 text-sm">{data?.unit || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
