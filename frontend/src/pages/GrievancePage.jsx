import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grievanceAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const PILLARS = [
  { value: 'air', label: 'Air Quality', icon: '💨' },
  { value: 'water', label: 'Water Quality', icon: '💧' },
  { value: 'noise', label: 'Noise Pollution', icon: '🔊' },
  { value: 'industrial', label: 'Industrial Emissions', icon: '🏭' },
  { value: 'waste', label: 'Solid Waste', icon: '🗑️' },
  { value: 'heat', label: 'Urban Heat', icon: '🌡️' },
  { value: 'groundwater', label: 'Groundwater', icon: '🌊' },
];

export default function GrievancePage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [formData, setFormData] = useState({
    pillar: 'air',
    description: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        location_name: location,
        city: city,
        pillar: formData.pillar,
        description: formData.description,
      };

      const response = await grievanceAPI.submit(payload);
      setTrackingId(response.data.tracking_id);
      setSubmitted(true);
      toast.success('Report submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setTrackingId('');
    setFormData({ pillar: 'air', description: '' });
  };

  if (submitted) {
    return (
      <Layout title="Report Submitted" subtitle={`${location}, ${city}`}>
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <i className="fas fa-check-circle text-5xl" style={{ color: '#10b981' }}></i>
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#111827' }}>Thank You!</h2>
            <p className="mb-6" style={{ color: '#6b7280' }}>
              Your report has been submitted successfully. The concerned authority will review it shortly.
            </p>

            <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <p className="text-sm mb-2" style={{ color: '#6b7280' }}>Your Tracking ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-bold" style={{ color: '#10b981' }}>{trackingId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trackingId);
                    toast.success('Tracking ID copied!');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    border: '1px solid #10b981',
                    color: '#10b981',
                    backgroundColor: 'transparent'
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>Save this ID to track your report status</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleNewReport}
                className="px-6 py-2 rounded-lg font-semibold transition-all"
                style={{
                  border: '1px solid #10b981',
                  color: '#10b981',
                  backgroundColor: 'transparent'
                }}
              >
                Submit Another
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 rounded-lg font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Report Environmental Issue" subtitle={`${location}, ${city}`}>
      <div className="w-full px-8">
        {/* Info Banner */}
        <div className="card mb-4" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-xl" style={{ color: '#10b981' }}></i>
            <div>
              <h3 className="font-bold mb-1" style={{ color: '#111827' }}>Citizen Reporting System</h3>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Report environmental violations or concerns in your area. Your submission will be forwarded to the appropriate authority for action.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="card">
          <h3 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>
            Report Details
          </h3>
          <p className="text-sm mb-5" style={{ color: '#6b7280' }}>
            Select the category and describe the environmental issue
          </p>

          {/* Category Selection */}
          <div className="mb-5">
            <label className="text-sm font-semibold mb-3 block" style={{ color: '#111827' }}>
              Environmental Category
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, pillar: pillar.value })}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    height: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: formData.pillar === pillar.value ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                    border: formData.pillar === pillar.value ? '2px solid #10b981' : '1px solid #e5e7eb',
                    boxShadow: formData.pillar === pillar.value ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.pillar !== pillar.value) {
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.pillar !== pillar.value) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                >
                  <div className="text-2xl mb-1">{pillar.icon}</div>
                  <div className="text-xs font-semibold text-center" style={{ color: '#111827' }}>{pillar.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#111827' }}>
              Description
              <span style={{ color: '#dc2626' }}> *</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              className="w-full rounded-lg resize-y"
              style={{
                minHeight: '160px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '1px solid #d1d5db',
                color: '#111827',
                outline: 'none',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              placeholder="Describe the environmental issue in detail. Include location specifics, time of occurrence, and any other relevant information..."
              required
              minLength={10}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
              Minimum 10 characters • {formData.description.length} / 500
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.description.length < 10}
            className="w-full py-3 rounded-xl font-bold text-base transition-all"
            style={{
              background: loading || formData.description.length < 10 ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: loading || formData.description.length < 10 ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
              cursor: loading || formData.description.length < 10 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <i className="fas fa-paper-plane mr-2"></i>
                Submit Report
              </span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-4 text-center text-sm" style={{ color: '#9ca3af' }}>
          <p>Your report will be reviewed by the concerned authority within 48 hours.</p>
        </div>
      </div>
    </Layout>
  );
}
