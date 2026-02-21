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
    } catch (error) {
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl mb-4" style={{ color: '#FF4B2B' }}></i>
          <p style={{ color: '#8390A2' }}>Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#333' }}>Select Your Location</h1>
          <p className="text-lg" style={{ color: '#8390A2' }}>Choose a city and location to monitor environmental data</p>
        </div>

        {/* City Selection */}
        {!selectedCity ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {Object.keys(cities).map((cityName) => (
              <button
                key={cityName}
                onClick={() => setSelectedCity(cityName)}
                className="card text-left transform transition-all hover:scale-105"
                style={{ padding: '2rem' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 75, 43, 0.1)' }}
                  >
                    <i className="fas fa-city text-3xl" style={{ color: '#FF4B2B' }}></i>
                  </div>
                  <i className="fas fa-chevron-right text-2xl" style={{ color: '#8390A2' }}></i>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#333' }}>{cityName}</h2>
                <p style={{ color: '#8390A2' }}>
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
              className="btn-ghost mb-6"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Cities
            </button>

            {/* Location Grid */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#333' }}>{selectedCity}</h2>
              <p style={{ color: '#8390A2' }}>Select a location to monitor</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities[selectedCity].map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLocationSelect(selectedCity, loc.location)}
                  className="card text-left transform transition-all hover:scale-105"
                  style={{ padding: '1.5rem' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255, 75, 43, 0.1)' }}
                    >
                      <i className="fas fa-map-marker-alt" style={{ color: '#FF4B2B' }}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate" style={{ color: '#333' }}>{loc.location}</h3>
                      <p className="text-xs uppercase tracking-wide" style={{ color: '#8390A2' }}>
                        {loc.zone_type || 'Mixed Zone'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#8390A2' }}>
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
