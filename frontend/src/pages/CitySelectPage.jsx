import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

export default function CitySelectPage() {
  const navigate = useNavigate();
  const { setCity, setLocation } = useAppStore();
  const [cities, setCities] = useState({});
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await locationsAPI.list();
      setCities(response.data.cities);
    } catch {
      toast.error('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (cityName, locationName) => {
    setCity(cityName);
    setLocation(locationName);
    toast.success(`Selected ${locationName}, ${cityName}`);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#10b981' }}></i>
          <p style={{ color: '#6b7280' }}>Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ 
              background: 'linear-gradient(to right, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>EnviroWatch</h1>
            <p className="text-xs" style={{ color: '#6b7280' }}>Environmental Intelligence Platform</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{
              border: '1px solid #10b981',
              color: '#10b981',
              backgroundColor: 'transparent'
            }}
          >
            <i className="fas fa-arrow-left mr-2"></i> Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Page Title */}
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl font-bold mb-3" style={{ color: '#111827' }}>Select Your Location</h2>
          <p className="text-lg" style={{ color: '#6b7280' }}>Choose a city and location to monitor environmental data</p>
        </div>

        {/* City Selection */}
        {!selectedCity ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {Object.keys(cities).map((cityName) => (
              <button
                key={cityName}
                onClick={() => setSelectedCity(cityName)}
                className="text-left transform transition-all p-8 rounded-2xl"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <i className="fas fa-city text-3xl" style={{ color: '#10b981' }}></i>
                  </div>
                  <i className="fas fa-chevron-right text-2xl" style={{ color: '#d1d5db' }}></i>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>{cityName}</h3>
                <p style={{ color: '#6b7280' }}>
                  {cities[cityName].length} location{cities[cityName].length !== 1 ? 's' : ''} available
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setSelectedCity('')}
              className="px-6 py-2 rounded-lg font-semibold text-sm transition-all mb-6"
              style={{
                border: '1px solid #10b981',
                color: '#10b981',
                backgroundColor: 'transparent'
              }}
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Cities
            </button>

            {/* Location Grid */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>{selectedCity}</h3>
              <p style={{ color: '#6b7280' }}>Select a location to monitor</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities[selectedCity].map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLocationSelect(selectedCity, loc.location)}
                  className="text-left transform transition-all p-6 rounded-xl"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                    >
                      <i className="fas fa-map-marker-alt" style={{ color: '#10b981' }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1 truncate" style={{ color: '#111827' }}>{loc.location}</h4>
                      <p className="text-xs uppercase tracking-wide" style={{ color: '#6b7280' }}>
                        {loc.zone_type || 'Mixed Zone'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#9ca3af' }}>
                    <i className="fas fa-map-pin"></i>
                    <span>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
    </div>
  );
}
