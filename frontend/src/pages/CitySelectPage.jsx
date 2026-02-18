import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { MapPin, Building2, ChevronRight, Loader2 } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-brand-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-white mb-3">Select Your Location</h1>
          <p className="text-gray-400 text-lg">Choose a city and location to monitor environmental data</p>
        </div>

        {/* City Selection */}
        {!selectedCity ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {Object.keys(cities).map((cityName) => (
              <button
                key={cityName}
                onClick={() => setSelectedCity(cityName)}
                className="card-hover group text-left p-8 transform transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-brand-600/20 rounded-xl flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
                    <Building2 className="w-7 h-7 text-brand-400" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-brand-400 transition-colors" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{cityName}</h2>
                <p className="text-gray-400">
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
              ← Back to Cities
            </button>

            {/* Location Grid */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedCity}</h2>
              <p className="text-gray-400">Select a location to monitor</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities[selectedCity].map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLocationSelect(selectedCity, loc.location)}
                  className="card-hover group text-left p-6 transform transition-all hover:scale-105"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-pillar-air/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-pillar-air/30 transition-colors">
                      <MapPin className="w-5 h-5 text-pillar-air" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">{loc.location}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{loc.zone_type || 'Mixed Zone'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
