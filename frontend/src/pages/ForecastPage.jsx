import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { forecastAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

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

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const response = await forecastAPI.get48hr(city, location, selectedPillar);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [city, location, selectedPillar]);

  const chartData = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((point) => ({
      time: new Date(point.time).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      fullDate: new Date(point.time).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      value: point.value,
      threshold: data.threshold,
      breach: point.will_breach,
    }));
  }, [data]);

  const breachCount = useMemo(() => 
    data?.points?.filter(p => p.will_breach).length || 0,
    [data]
  );

  const CustomTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #FF4B2B',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{ color: '#333', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            {data.fullDate}
          </p>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600' }}>Value:</span> {data.value.toFixed(2)} {payload[0].unit}
          </p>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600' }}>Threshold:</span> {data.threshold} {payload[0].unit}
          </p>
          <p style={{ 
            color: data.breach ? '#dc2626' : '#10b981', 
            fontSize: '12px',
            fontWeight: '600',
            marginTop: '6px'
          }}>
            {data.breach ? '⚠️ Above Threshold' : '✓ Within Safe Limits'}
          </p>
        </div>
      );
    }
    return null;
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#FF4B2B' }}></i>
            <p style={{ color: '#8390A2' }}>Loading forecast...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="48-Hour Forecast" subtitle={`${location}, ${city}`}>
      {/* Pillar Selector */}
      <div className="mb-6">
        <label className="text-sm font-semibold uppercase mb-2 block" style={{ color: '#8390A2' }}>
          Select Environmental Pillar
        </label>
        <div className="flex flex-wrap gap-2">
          {PILLARS.map((pillar) => (
            <button
              key={pillar.value}
              onClick={() => setSelectedPillar(pillar.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPillar === pillar.value
                  ? 'btn-primary'
                  : 'card-single hover:border-[#FF4B2B]'
              }`}
            >
              {pillar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      {data && (
        <div className={`card mb-6 ${breachCount > 0 ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${breachCount > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              {breachCount > 0 ? (
                <i className="fas fa-exclamation-triangle text-2xl text-yellow-600"></i>
              ) : (
                <i className="fas fa-check-circle text-2xl text-green-600"></i>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>{data.parameter} Forecast</h3>
              <p className="mb-3" style={{ color: '#555' }}>{data.summary}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span style={{ color: '#8390A2' }}>Threshold: </span>
                  <span className="font-semibold" style={{ color: '#333' }}>{data.threshold} {data.unit}</span>
                </div>
                {data.peak_risk_time && (
                  <div>
                    <span style={{ color: '#8390A2' }}>Peak Risk: </span>
                    <span className="font-semibold" style={{ color: '#333' }}>
                      {new Date(data.peak_risk_time).toLocaleString('en-IN', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </span>
                  </div>
                )}
                <div>
                  <span style={{ color: '#8390A2' }}>Breach Hours: </span>
                  <span className={`font-semibold ${breachCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {breachCount} / 48
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#333' }}>
          {data?.parameter} Levels - Next 48 Hours
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              interval={5}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: data?.unit || '', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#6b7280' }} />
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
        <div className="card-single text-center">
          <p className="text-sm mb-1" style={{ color: '#8390A2' }}>Current Value</p>
          <p className="text-4xl font-bold" style={{ color: '#FF4B2B' }}>
            {data?.points?.[0]?.value ? data.points[0].value.toFixed(1) : '0.0'}
          </p>
          <p className="text-sm" style={{ color: '#8390A2' }}>{data?.unit || ''}</p>
        </div>
        <div className="card-single text-center">
          <p className="text-sm mb-1" style={{ color: '#8390A2' }}>Average (48hr)</p>
          <p className="text-4xl font-bold" style={{ color: '#FF4B2B' }}>
            {data?.points?.length > 0
              ? (data.points.reduce((sum, p) => sum + p.value, 0) / data.points.length).toFixed(1)
              : '0.0'}
          </p>
          <p className="text-sm" style={{ color: '#8390A2' }}>{data?.unit || ''}</p>
        </div>
        <div className="card-single text-center">
          <p className="text-sm mb-1" style={{ color: '#8390A2' }}>Peak Value</p>
          <p className="text-4xl font-bold" style={{ color: '#FF4B2B' }}>
            {data?.points?.length > 0
              ? Math.max(...data.points.map(p => p.value)).toFixed(1)
              : '0.0'}
          </p>
          <p className="text-sm" style={{ color: '#8390A2' }}>{data?.unit || ''}</p>
        </div>
      </div>
    </Layout>
  );
}
