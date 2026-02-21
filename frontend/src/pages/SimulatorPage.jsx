import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  
  const [scenario, setScenario] = useState({
    traffic_change_pct: 0,
    industrial_change_pct: 0,
    wind_speed_change_pct: 0,
    rainfall_change_pct: 0,
    festival_activity_pct: 0,
    green_cover_change_pct: 0,
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const runSimulation = async () => {
    if (!city || !location) {
      toast.error('Please select a location first');
      navigate('/select-city');
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        city,
        location,
        ...scenario
      });
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/simulation/predict-impact?${params}`, {
        method: 'POST'
      });
      const data = await response.json();
      setResults(data);
      toast.success('Simulation complete!');
    } catch (error) {
      toast.error('Simulation failed');
    } finally {
      setLoading(false);
    }
  };
  
  const reset = () => {
    setScenario({ 
      traffic_change_pct: 0, 
      industrial_change_pct: 0, 
      wind_speed_change_pct: 0,
      rainfall_change_pct: 0,
      festival_activity_pct: 0,
      green_cover_change_pct: 0,
    });
    setResults(null);
  };
  
  const chartData = results ? Object.entries(results.results).map(([key, value]) => ({
    name: key,  // Already formatted as "Air Quality", "Water Quality", etc.
    baseline: value.baseline,
    predicted: value.predicted,
  })) : [];

  if (!city || !location) {
    navigate('/select-city');
    return null;
  }
  
  return (
    <Layout title="What-If Simulator" subtitle={`${location}, ${city}`}>
      {/* Scenario Controls */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
          Scenario Parameters
        </h3>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
          Adjust sliders to simulate environmental scenarios. Test festival impacts (Diwali, Ganesh Chaturthi), monsoon effects on air/water/soil, and policy interventions.
        </p>

        <div className="space-y-6">
          {/* Traffic Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-car mr-2" style={{ color: '#10b981' }}></i>
                Traffic Change
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.traffic_change_pct > 0 ? '#dc2626' : scenario.traffic_change_pct < 0 ? '#10b981' : '#6b7280' 
              }}>
                {scenario.traffic_change_pct > 0 ? '+' : ''}{scenario.traffic_change_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.traffic_change_pct}
              onChange={e => setScenario(s => ({ ...s, traffic_change_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.traffic_change_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.traffic_change_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Industrial Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-industry mr-2" style={{ color: '#10b981' }}></i>
                Industrial Activity
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.industrial_change_pct > 0 ? '#dc2626' : scenario.industrial_change_pct < 0 ? '#10b981' : '#6b7280' 
              }}>
                {scenario.industrial_change_pct > 0 ? '+' : ''}{scenario.industrial_change_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.industrial_change_pct}
              onChange={e => setScenario(s => ({ ...s, industrial_change_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.industrial_change_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.industrial_change_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Wind Speed Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-wind mr-2" style={{ color: '#10b981' }}></i>
                Wind Speed
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.wind_speed_change_pct > 0 ? '#10b981' : scenario.wind_speed_change_pct < 0 ? '#dc2626' : '#6b7280' 
              }}>
                {scenario.wind_speed_change_pct > 0 ? '+' : ''}{scenario.wind_speed_change_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.wind_speed_change_pct}
              onChange={e => setScenario(s => ({ ...s, wind_speed_change_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.wind_speed_change_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.wind_speed_change_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
          </div>

          {/* Rainfall Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-cloud-rain mr-2" style={{ color: '#10b981' }}></i>
                Rainfall
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.rainfall_change_pct > 0 ? '#10b981' : scenario.rainfall_change_pct < 0 ? '#dc2626' : '#6b7280' 
              }}>
                {scenario.rainfall_change_pct > 0 ? '+' : ''}{scenario.rainfall_change_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="10"
              value={scenario.rainfall_change_pct}
              onChange={e => setScenario(s => ({ ...s, rainfall_change_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.rainfall_change_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.rainfall_change_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              Reduces air pollution, affects water & soil quality
            </p>
          </div>

          {/* Festival/Holiday Activity Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-calendar-day mr-2" style={{ color: '#10b981' }}></i>
                Festival/Holiday Activity
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.festival_activity_pct > 0 ? '#dc2626' : scenario.festival_activity_pct < 0 ? '#10b981' : '#6b7280' 
              }}>
                {scenario.festival_activity_pct > 0 ? '+' : ''}{scenario.festival_activity_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="10"
              value={scenario.festival_activity_pct}
              onChange={e => setScenario(s => ({ ...s, festival_activity_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.festival_activity_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.festival_activity_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
              Diwali, Ganesh Chaturthi, Holi: firecrackers, traffic, waste
            </p>
          </div>

          {/* Green Cover Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xl font-bold" style={{ color: '#111827' }}>
                <i className="fas fa-tree mr-2" style={{ color: '#10b981' }}></i>
                Green Cover
              </label>
              <span className="text-2xl font-bold" style={{ 
                color: scenario.green_cover_change_pct > 0 ? '#10b981' : scenario.green_cover_change_pct < 0 ? '#dc2626' : '#6b7280' 
              }}>
                {scenario.green_cover_change_pct > 0 ? '+' : ''}{scenario.green_cover_change_pct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.green_cover_change_pct}
              onChange={e => setScenario(s => ({ ...s, green_cover_change_pct: Number(e.target.value) }))}
              className="slider"
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((scenario.green_cover_change_pct + 50) / 150) * 100}%, #e5e7eb ${((scenario.green_cover_change_pct + 50) / 150) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={runSimulation}
            disabled={loading}
            className="flex-1 py-3 text-base font-semibold rounded-xl transition-all"
            style={{
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: loading ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                Running Simulation...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-play mr-2"></i>
                Run Simulation
              </span>
            )}
          </button>
          <button 
            onClick={reset} 
            className="px-6 py-3 rounded-xl font-semibold transition-all"
            style={{
              border: '1px solid #10b981',
              color: '#10b981',
              backgroundColor: 'transparent'
            }}
          >
            <i className="fas fa-redo mr-2"></i>
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Summary Alert Card */}
          <div className={`card mb-6 ${
            results.aqi.change < 0
              ? 'border-l-4 border-green-500'
              : 'border-l-4 border-yellow-500'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                results.aqi.change < 0 ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {results.aqi.change < 0
                  ? <i className="fas fa-check-circle text-2xl text-green-600"></i>
                  : <i className="fas fa-exclamation-triangle text-2xl text-yellow-600"></i>
                }
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
                  Simulation Results
                </h3>
                <p className="mb-3" style={{ color: '#4b5563' }}>{results.summary}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span style={{ color: '#6b7280' }}>Baseline AQI: </span>
                    <span className="font-semibold" style={{ color: '#111827' }}>{results.aqi.baseline}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Predicted AQI: </span>
                    <span className={`font-semibold ${results.aqi.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.aqi.predicted}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Change: </span>
                    <span className={`font-semibold ${results.aqi.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.aqi.change > 0 ? '+' : ''}{results.aqi.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
              Parameter Impact Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ color: '#6b7280' }} />
                <Bar dataKey="baseline" fill="#9ca3af" name="Current" />
                <Bar dataKey="predicted" fill="#10b981" name="Predicted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Layout>
  );
}
