import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { dashboardAPI, locationsAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapPage() {
  const navigate = useNavigate();
  const { city } = useAppStore();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([18.5204, 73.8567]); // Pune default

  useEffect(() => {
    if (!city) {
      navigate('/select-city');
      return;
    }
    fetchLocations();
  }, [city]);

  const fetchLocations = async () => {
    try {
      const response = await dashboardAPI.getCityOverview(city);
      const locs = response.data.locations || [];
      setLocations(locs);
      
      if (locs.length > 0) {
        setCenter([locs[0].latitude, locs[0].longitude]);
      }
    } catch (error) {
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#dc2626',
    };
    return colors[risk?.toLowerCase()] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Risk Map</h1>
              <p className="text-sm text-gray-400">{city} Environmental Overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[calc(100vh-80px)]">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          style={{ background: '#111827' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {locations.map((loc, idx) => (
            <CircleMarker
              key={idx}
              center={[loc.latitude, loc.longitude]}
              radius={15}
              pathOptions={{
                fillColor: getRiskColor(loc.risk),
                fillOpacity: 0.6,
                color: getRiskColor(loc.risk),
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-gray-900 p-2">
                  <h3 className="font-bold text-lg mb-1">{loc.name}</h3>
                  <div className="space-y-1 text-sm">
                    <p>AQI: <span className="font-semibold">{loc.aqi}</span></p>
                    <p>Risk: <span className="font-semibold capitalize">{loc.risk}</span></p>
                    <button
                      onClick={() => {
                        useAppStore.getState().setLocation(loc.name);
                        navigate('/dashboard');
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 card p-4 z-[1000]">
          <h3 className="text-sm font-semibold text-white mb-3">Risk Levels</h3>
          <div className="space-y-2">
            {[
              { label: 'Low', color: '#10b981' },
              { label: 'Medium', color: '#f59e0b' },
              { label: 'High', color: '#f97316' },
              { label: 'Critical', color: '#dc2626' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location Count */}
        <div className="absolute top-6 right-6 card p-3 z-[1000]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" />
            <span className="text-white font-semibold">{locations.length}</span>
            <span className="text-gray-400 text-sm">locations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
