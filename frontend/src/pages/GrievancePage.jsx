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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiClassification, setAiClassification] = useState(null);
  const [formData, setFormData] = useState({
    pillar: 'air',
    description: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Mock AI classification based on filename
      classifyImage(file.name);
    };
    reader.readAsDataURL(file);
  };

  const classifyImage = (filename) => {
    // Mock AI classification based on keywords in filename
    const lower = filename.toLowerCase();
    let category = 'general';
    let confidence = 0.75;

    if (lower.includes('smoke') || lower.includes('pollution') || lower.includes('air')) {
      category = 'air_pollution';
      confidence = 0.92;
    } else if (lower.includes('water') || lower.includes('drain') || lower.includes('sewage')) {
      category = 'water_contamination';
      confidence = 0.88;
    } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash')) {
      category = 'solid_waste';
      confidence = 0.85;
    } else if (lower.includes('noise') || lower.includes('construction')) {
      category = 'noise_pollution';
      confidence = 0.80;
    } else if (lower.includes('factory') || lower.includes('industrial')) {
      category = 'industrial_emissions';
      confidence = 0.87;
    }

    setAiClassification({ category, confidence });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAiClassification(null);
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
      <div className="min-h-screen animated-gradient">
        <div className="glass-card border-b border-white/10 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-gradient">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold gradient-text neon-glow">Grievance Submitted</h1>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="glass-card card-hover text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 floating">
              <CheckCircle className="w-10 h-10 text-green-400 neon-glow" />
            </div>
            <h2 className="text-4xl font-bold gradient-text neon-glow mb-3">Thank You!</h2>
            <p className="text-gray-300 mb-6">
              Your grievance has been submitted successfully. The concerned authority will review it shortly.
            </p>

            <div className="glass-card rounded-lg p-6 mb-6">
              <p className="text-gray-300 text-sm mb-2">Your Tracking ID</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold gradient-text neon-glow">{trackingId}</code>
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
              <p className="text-gray-400 text-xs mt-2">Save this ID to track your grievance status</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={handleNewGrievance} className="btn-ghost">
                Submit Another
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-gradient">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient">
      {/* Floating Particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      
      {/* Header */}
      <div className="glass-card border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="btn-gradient">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text neon-glow">Report Environmental Issue</h1>
            <p className="text-sm text-gray-300">Help us improve environmental quality in your area</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Info Card */}
        <div className="glass-card card-hover mb-6 border-2 border-brand-500/30">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5 floating" />
            <div>
              <h3 className="font-semibold gradient-text mb-1">Citizen Grievance System</h3>
              <p className="text-sm text-gray-300">
                Report environmental violations or concerns in your area. Your submission will be forwarded to the appropriate authority for action.
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="glass-card card-hover mb-6">
          <div className="flex items-center gap-3 text-gray-200">
            <MapPin className="w-5 h-5 text-brand-400 neon-glow" />
            <div>
              <p className="text-sm text-gray-300">Reporting for</p>
              <p className="font-semibold text-white">{location}, {city}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card card-hover">
          <h2 className="text-xl font-semibold gradient-text mb-6">Grievance Details</h2>

          {/* Pillar Selection */}
          <div className="mb-6">
            <label className="label mb-3 text-gray-300">Environmental Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, pillar: pillar.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-left glass-card ${
                    formData.pillar === pillar.value
                      ? 'border-brand-500 bg-brand-500/10 neon-glow'
                      : 'border-white/20 hover:border-brand-400'
                  }`}
                >
                  <div className="text-2xl mb-2 floating">{pillar.icon}</div>
                  <div className="text-sm font-medium text-white">{pillar.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="label mb-2 text-gray-300">
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
            <p className="text-xs text-gray-400 mt-1">
              Minimum 10 characters • {formData.description.length} / 500
            </p>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="label mb-2 text-gray-300">
              Upload Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-brand-500 transition glass-card">
              {!imagePreview ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="w-16 h-16 glass-card rounded-full flex items-center justify-center mx-auto mb-3 floating">
                      <span className="text-3xl">📷</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">Click to upload an image</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {aiClassification && (
                    <div className="glass-card border-2 border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg floating">🤖</span>
                        <span className="text-sm font-semibold text-purple-300">AI Classification</span>
                      </div>
                      <p className="text-sm text-gray-200 mb-1">
                        Detected: <span className="font-semibold capitalize">{aiClassification.category.replace(/_/g, ' ')}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${aiClassification.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-300">
                          {(aiClassification.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.description.length < 10}
            className="btn-gradient w-full py-3 text-base font-semibold"
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
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Your grievance will be reviewed by the concerned authority within 48 hours.</p>
          <p className="mt-1">You will receive a tracking ID to monitor the status.</p>
        </div>
      </div>
    </div>
  );
}
