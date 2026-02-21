import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import Layout from '../components/Layout';

export default function SiteAnalyzerPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [constructionTypes, setConstructionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!city || !location) {
      toast.error('Please select a city and location first');
      navigate('/select-city');
      return;
    }
    fetchConstructionTypes();
  }, [city, location, navigate]);

  const fetchConstructionTypes = async () => {
    try {
      const res = await api.get('/api/site-analysis/construction-types');
      setConstructionTypes(res.data.types);
      if (res.data.types.length > 0) {
        setSelectedType(res.data.types[0].id);
      }
    } catch (err) {
      toast.error('Failed to load construction types');
    }
  };

  const analyzeSite = async () => {
    if (!selectedType) {
      toast.error('Please select a construction type');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await api.get('/api/site-analysis/analyze', {
        params: { city, location, construction_type: selectedType }
      });
      setResult(res.data);
      
      if (res.data.should_build) {
        toast.success('Site analysis complete!');
      } else {
        toast.error('Site not recommended for this construction');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Layout title="Site Suitability Analyzer" subtitle={`${location}, ${city}`}>
      {/* Construction Type Selection */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
          Select Construction Type
        </h3>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
          Choose the type of construction to analyze environmental suitability
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {constructionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className="p-6 rounded-xl transition-all text-center"
              style={{
                backgroundColor: selectedType === type.id ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                border: selectedType === type.id ? '2px solid #10b981' : '1px solid #e5e7eb',
                boxShadow: selectedType === type.id ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <div className="font-semibold" style={{ color: '#111827' }}>{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={analyzeSite}
          disabled={analyzing || !selectedType}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
          style={{
            background: analyzing || !selectedType ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            boxShadow: analyzing || !selectedType ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
            cursor: analyzing || !selectedType ? 'not-allowed' : 'pointer'
          }}
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing Site...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <i className="fas fa-search mr-2"></i>
              Analyze Site Suitability
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Decision Summary */}
          <div className={`card ${
            result.should_build 
              ? 'border-l-4 border-green-500' 
              : 'border-l-4 border-red-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{result.icon}</span>
                  <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                    {result.construction_type}
                  </h3>
                </div>
                <p className="text-lg mb-4" style={{ color: '#4b5563' }}>{result.decision_summary}</p>
              </div>
              <div className="text-right ml-6">
                <div className="text-5xl font-bold mb-2" style={{ 
                  color: result.should_build ? '#10b981' : '#dc2626' 
                }}>
                  {result.suitability_score}/100
                </div>
                <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{
                  backgroundColor: result.risk_level === 'low' ? 'rgba(16, 185, 129, 0.1)' :
                                 result.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.1)' :
                                 'rgba(220, 38, 38, 0.1)',
                  color: result.risk_level === 'low' ? '#10b981' :
                        result.risk_level === 'medium' ? '#f59e0b' :
                        '#dc2626',
                  border: `1px solid ${result.risk_level === 'low' ? '#10b981' :
                                      result.risk_level === 'medium' ? '#f59e0b' :
                                      '#dc2626'}`
                }}>
                  {result.risk_level.toUpperCase()} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Checks */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
              Environmental Compliance Checks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.environmental_checks).map(([key, check]) => (
                <div
                  key={key}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: check.status === 'pass' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(220, 38, 38, 0.05)',
                    border: `1px solid ${check.status === 'pass' ? '#10b981' : '#dc2626'}`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize" style={{ color: '#111827' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-2xl">
                      {check.status === 'pass' ? '✅' : '❌'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6b7280' }}>{check.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Violations */}
          {result.violations && result.violations.length > 0 && (
            <div className="card border-l-4 border-yellow-500">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Environmental Violations Detected
              </h3>
              <div className="space-y-3">
                {result.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold" style={{ color: '#111827' }}>{violation.factor}</span>
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                        backgroundColor: violation.severity === 'critical' ? '#dc2626' :
                                       violation.severity === 'high' ? '#f97316' :
                                       '#f59e0b',
                        color: '#ffffff'
                      }}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#4b5563' }}>{violation.message}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      <span className="font-semibold">Impact:</span> {violation.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Recommendations
              </h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderLeft: `4px solid ${
                        rec.type === 'approval' ? '#10b981' :
                        rec.type === 'rejection' ? '#dc2626' :
                        rec.type === 'mitigation' ? '#3b82f6' :
                        '#f59e0b'
                      }`
                    }}
                  >
                    <p className="text-sm" style={{ color: '#4b5563' }}>{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
