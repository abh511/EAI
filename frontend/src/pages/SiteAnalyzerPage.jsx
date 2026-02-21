import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAppStore from '../store/useAppStore'
import api from '../services/api'

export default function SiteAnalyzerPage() {
  const navigate = useNavigate()
  const { city, location } = useAppStore()
  const [constructionTypes, setConstructionTypes] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!city || !location) {
      toast.error('Please select a city and location first')
      navigate('/select-city')
      return
    }
    fetchConstructionTypes()
  }, [city, location, navigate])

  const fetchConstructionTypes = async () => {
    try {
      const res = await api.get('/api/site-analysis/construction-types')
      setConstructionTypes(res.data.types)
      if (res.data.types.length > 0) {
        setSelectedType(res.data.types[0].id)
      }
    } catch (err) {
      toast.error('Failed to load construction types')
    }
  }

  const analyzeSite = async () => {
    if (!selectedType) {
      toast.error('Please select a construction type')
      return
    }

    setAnalyzing(true)
    setResult(null)

    try {
      const res = await api.get('/api/site-analysis/analyze', {
        params: { city, location, construction_type: selectedType }
      })
      setResult(res.data)
      
      if (res.data.should_build) {
        toast.success('Site analysis complete!')
      } else {
        toast.error('Site not recommended for this construction')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const getRiskColor = (level) => {
    const colors = {
      low: 'text-green-400 bg-green-500/10 border-green-500/30',
      medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      critical: 'text-red-400 bg-red-500/10 border-red-500/30'
    }
    return colors[level] || colors.medium
  }

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-500/20 text-blue-300',
      medium: 'bg-yellow-500/20 text-yellow-300',
      high: 'bg-orange-500/20 text-orange-300',
      critical: 'bg-red-500/20 text-red-300'
    }
    return colors[severity] || colors.medium
  }

  return (
    <div className="min-h-screen animated-gradient text-white p-6">
      {/* Floating Particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 btn-gradient"
        >
          ← Back to Dashboard
        </button>
        
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-5xl font-bold gradient-text neon-glow">🏗️ Site Suitability Analyzer</h1>
        </div>
        <p className="text-gray-300 text-lg">
          AI-powered environmental compliance checker for urban planning
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Analyzing: <span className="text-brand-400 neon-glow">{location}, {city}</span>
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="glass-card card-hover">
          <h2 className="text-2xl font-semibold gradient-text mb-4">Select Construction Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {constructionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border-2 transition text-left glass-card ${
                  selectedType === type.id
                    ? 'border-brand-500 bg-brand-500/10 neon-glow'
                    : 'border-white/20 hover:border-brand-400'
                }`}
              >
                <div className="text-3xl mb-2 floating">{type.icon}</div>
                <div className="font-semibold text-sm text-white">{type.name}</div>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="glass-card rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-200">
                <span className="font-semibold gradient-text">Why this matters:</span>{' '}
                {constructionTypes.find(t => t.id === selectedType)?.rationale}
              </p>
            </div>
          )}

          <button
            onClick={analyzeSite}
            disabled={analyzing || !selectedType}
            className="w-full py-3 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {analyzing ? '🔍 Analyzing Site...' : '🚀 Analyze Site Suitability'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Decision Summary */}
          <div className={`border-2 rounded-xl p-6 glass-card card-hover ${
            result.should_build 
              ? 'border-green-500/50 neon-glow' 
              : 'border-red-500/50'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">
                  {result.icon} {result.construction_type}
                </h2>
                <p className="text-lg text-gray-200">{result.decision_summary}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold gradient-text neon-glow mb-1">
                  {result.suitability_score}/100
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(result.risk_level)}`}>
                  {result.risk_level.toUpperCase()} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Checks */}
          <div className="glass-card card-hover">
            <h3 className="text-2xl font-semibold gradient-text mb-4">📊 Environmental Compliance Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.environmental_checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg border glass-card ${
                    check.status === 'pass'
                      ? 'border-green-500/30'
                      : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize text-white">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-2xl floating">
                      {check.status === 'pass' ? '✅' : '❌'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{check.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Violations */}
          {result.violations.length > 0 && (
            <div className="glass-card card-hover">
              <h3 className="text-2xl font-semibold gradient-text mb-4">⚠️ Environmental Violations Detected</h3>
              <div className="space-y-3">
                {result.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-lg p-4 border-l-4 border-orange-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-white">{violation.factor}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(violation.severity)}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2">{violation.message}</p>
                    <p className="text-xs text-gray-300">
                      <span className="font-semibold">Impact:</span> {violation.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="glass-card card-hover">
              <h3 className="text-2xl font-semibold gradient-text mb-4">💡 Recommendations</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg glass-card ${
                      rec.type === 'approval' ? 'border-l-4 border-green-500' :
                      rec.type === 'rejection' ? 'border-l-4 border-red-500' :
                      rec.type === 'mitigation' ? 'border-l-4 border-blue-500' :
                      'border-l-4 border-yellow-500'
                    }`}
                  >
                    <p className="text-sm text-gray-200">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Locations */}
          {result.alternative_locations && result.alternative_locations.length > 0 && (
            <div className="glass-card card-hover">
              <h3 className="text-2xl font-semibold gradient-text mb-4">📍 Better Alternative Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.alternative_locations.map((alt, idx) => (
                  <div
                    key={idx}
                    className="glass-card border-2 border-green-500/30 rounded-lg p-4 card-hover"
                  >
                    <div className="text-3xl font-bold gradient-text neon-glow mb-2">
                      {alt.suitability_score}/100
                    </div>
                    <div className="font-semibold text-white mb-2">{alt.location}</div>
                    <p className="text-sm text-gray-200">{alt.key_advantage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factory Impact Prediction */}
          {result.predicted_impact && (
            <div className="glass-card card-hover">
              <h3 className="text-2xl font-semibold gradient-text mb-4">🏭 Predicted Environmental Impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Object.entries(result.predicted_impact.construction_impact).map(([pollutant, data]) => (
                  <div key={pollutant} className="glass-card rounded-lg p-4">
                    <div className="text-sm text-gray-300 mb-2 uppercase font-semibold">{pollutant}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-200">Before:</span>
                      <span className="font-semibold text-white">{data.before}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-200">After:</span>
                      <span className="font-semibold text-orange-400 neon-glow">{data.after}</span>
                    </div>
                    <div className="text-xs text-red-400">
                      +{data.change_pct || data.change_dba} {data.change_pct ? '%' : 'dB(A)'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card border-l-4 border-red-500 rounded-lg p-4 mb-4">
                <p className="text-sm mb-2 text-gray-200">
                  <span className="font-semibold text-white">Affected Radius:</span>{' '}
                  {result.predicted_impact.affected_radius_km} km
                </p>
                <p className="text-sm mb-2 text-gray-200">
                  <span className="font-semibold text-white">Estimated Affected Population:</span>{' '}
                  {result.predicted_impact.estimated_affected_population.toLocaleString()} residents
                </p>
                <p className="text-sm text-orange-300">
                  {result.predicted_impact.health_impact}
                </p>
              </div>

              <div className="glass-card border-l-4 border-blue-500 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-white">Required Mitigation Measures:</h4>
                <ul className="space-y-2">
                  {result.predicted_impact.mitigation_required.map((measure, idx) => (
                    <li key={idx} className="text-sm text-gray-200 flex items-start gap-2">
                      <span className="text-brand-400 mt-1">•</span>
                      <span>{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Rationale */}
          <div className="glass-card card-hover">
            <h3 className="text-2xl font-semibold gradient-text mb-3">📖 Why This Analysis Matters</h3>
            <p className="text-gray-200">{result.rationale}</p>
            <p className="text-xs text-gray-400 mt-4">
              Analysis completed at: {new Date(result.analyzed_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
