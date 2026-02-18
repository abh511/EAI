import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { grievanceAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, CheckCircle, MapPin, FileText } from 'lucide-react';

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
      toast.success('Grievance submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit grievance');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGrievance = () => {
    setSubmitted(false);
    setTrackingId('');
    setFormData({ pillar: 'air', description: '' });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Grievance Submitted</h1>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="card text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Thank You!</h2>
            <p className="text-gray-400 mb-6">
              Your grievance has been submitted successfully. The concerned authority will review it shortly.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <p className="text-gray-400 text-sm mb-2">Your Tracking ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-mono font-bold text-brand-400">{trackingId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trackingId);
                    toast.success('Tracking ID copied!');
                  }}
                  className="btn-ghost text-xs"
                >
                  Copy
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Save this ID to track your grievance status</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={handleNewGrievance} className="btn-secondary">
                Submit Another
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-primary">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Report Environmental Issue</h1>
            <p className="text-sm text-gray-400">Help us improve environmental quality in your area</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Info Card */}
        <div className="card mb-6 bg-brand-500/5 border-brand-500/30">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Citizen Grievance System</h3>
              <p className="text-sm text-gray-400">
                Report environmental violations or concerns in your area. Your submission will be forwarded to the appropriate authority for action.
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="w-5 h-5 text-brand-400" />
            <div>
              <p className="text-sm text-gray-400">Reporting for</p>
              <p className="font-semibold">{location}, {city}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Grievance Details</h2>

          {/* Pillar Selection */}
          <div className="mb-6">
            <label className="label mb-3">Environmental Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, pillar: pillar.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.pillar === pillar.value
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{pillar.icon}</div>
                  <div className="text-sm font-medium text-white">{pillar.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="label mb-2">
              Description
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-[150px] resize-y"
              placeholder="Describe the environmental issue in detail. Include location specifics, time of occurrence, and any other relevant information..."
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 characters • {formData.description.length} / 500
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.description.length < 10}
            className="btn-primary w-full py-3 text-base font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Submit Grievance
              </span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your grievance will be reviewed by the concerned authority within 48 hours.</p>
          <p className="mt-1">You will receive a tracking ID to monitor the status.</p>
        </div>
      </div>
    </div>
  );
}
