import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { Sliders, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  
  const [scenario, setScenario] = useState({
    traffic_change_pct: 0,
    industrial_change_pct: 0,
    wind_speed_change_pct: 0,
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
    setScenario({ traffic_change_pct: 0, industrial_change_pct: 0, wind_speed_change_pct: 0 });
    setResults(null);
  };
  
  const chartData = results ? Object.entries(results.results).map(([key, value]) => ({
    name: key.replace('_ug_m3', '').replace('_', ' ').toUpperCase(),
    baseline: value.baseline,
    predicted: value.predicted,
  })) : [];
  
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
              <h1 className="text-2xl font-bold gradient-text neon-glow flex items-center gap-2">
                <Sliders className="w-6 h-6 text-purple-400" />
                What-If Simulator
              </h1>
              <p className="text-sm text-gray-300">Test scenarios and predict environmental impact • {location}, {city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Traffic */}
          <div className="glass-card card-hover">
            <p className="text-gray-300 text-xs font-semibold uppercase mb-2">Traffic Change</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold gradient-text neon-glow">
                {scenario.traffic_change_pct > 0 ? '+' : ''}{scenario.traffic_change_pct}%
              </span>
              {scenario.traffic_change_pct !== 0 && (
                scenario.traffic_change_pct > 0
                  ? <TrendingUp className="w-5 h-5 text-red-400 floating" />
                  : <TrendingDown className="w-5 h-5 text-green-400 floating" />
              )}
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.traffic_change_pct}
              onChange={e => setScenario(s => ({ ...s, traffic_change_pct: Number(e.target.value) }))}
              className="w-full accent-brand-600"
            />
            <p className="text-xs text-gray-400 mt-2">Vehicle density impact on emissions</p>
          </div>

          {/* Industrial */}
          <div className="glass-card card-hover">
            <p className="text-gray-300 text-xs font-semibold uppercase mb-2">Industrial Activity</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold gradient-text neon-glow">
                {scenario.industrial_change_pct > 0 ? '+' : ''}{scenario.industrial_change_pct}%
              </span>
              {scenario.industrial_change_pct !== 0 && (
                scenario.industrial_change_pct > 0
                  ? <TrendingUp className="w-5 h-5 text-red-400 floating" />
                  : <TrendingDown className="w-5 h-5 text-green-400 floating" />
              )}
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.industrial_change_pct}
              onChange={e => setScenario(s => ({ ...s, industrial_change_pct: Number(e.target.value) }))}
              className="w-full accent-brand-600"
            />
            <p className="text-xs text-gray-400 mt-2">Factory output change effect</p>
          </div>

          {/* Wind */}
          <div className="glass-card card-hover">
            <p className="text-gray-300 text-xs font-semibold uppercase mb-2">Wind Speed</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold gradient-text neon-glow">
                {scenario.wind_speed_change_pct > 0 ? '+' : ''}{scenario.wind_speed_change_pct}%
              </span>
              {scenario.wind_speed_change_pct !== 0 && (
                scenario.wind_speed_change_pct > 0
                  ? <TrendingUp className="w-5 h-5 text-green-400 floating" />
                  : <TrendingDown className="w-5 h-5 text-red-400 floating" />
              )}
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={scenario.wind_speed_change_pct}
              onChange={e => setScenario(s => ({ ...s, wind_speed_change_pct: Number(e.target.value) }))}
              className="w-full accent-brand-600"
            />
            <p className="text-xs text-gray-400 mt-2">Pollutant dispersion rate</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={runSimulation}
            disabled={loading}
            className="btn-gradient flex-1 py-3 text-base font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running Simulation...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🧪 Run Simulation
              </span>
            )}
          </button>
          <button onClick={reset} className="btn-ghost px-6">
            Reset
          </button>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Summary Card */}
            <div className={`glass-card card-hover mb-6 border-2 ${
              results.aqi.change < 0
                ? 'border-green-500/50 neon-glow'
                : 'border-red-500/50'
            }`}>
              <div className="flex items-start gap-3">
                {results.aqi.change < 0
                  ? <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5 floating" />
                  : <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5 pulse" />
                }
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg mb-2 gradient-text">Simulation Results</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{results.summary}</p>
                  <div className="mt-4 flex items-center gap-6 text-sm">
                    <span style={{ color: '#1a1a1a' }}>
                      Baseline AQI: <strong style={{ color: '#1a1a1a' }}>{results.aqi.baseline}</strong>
                    </span>
                    <span style={{ color: '#1a1a1a' }}>→</span>
                    <span style={{ color: '#1a1a1a' }}>
                      Predicted AQI: <strong className={results.aqi.change < 0 ? 'text-green-400 neon-glow' : 'text-red-400'}>
                        {results.aqi.predicted}
                      </strong>
                    </span>
                    <span style={{ color: '#1a1a1a' }}>
                      Change: <strong className={results.aqi.change < 0 ? 'text-green-400' : 'text-red-400'}>
                        {results.aqi.change > 0 ? '+' : ''}{results.aqi.change}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-card card-hover">
              <p className="text-white font-semibold mb-4 text-lg gradient-text">Parameter Impact Breakdown</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: '#d1d5db', fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: '#d1d5db', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#f3f4f6',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="baseline" fill="#6b7280" name="Current" />
                  <Bar dataKey="predicted" fill="#667eea" name="Predicted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
