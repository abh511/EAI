import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { dashboardAPI } from '../services/api';
import useAppStore from '../store/useAppStore';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#991b1b' };

export default function MapPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const mapRef = useRef(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }
    dashboardAPI.getCityOverview(city)
      .then((res) => setOverview(res.data))
      .catch((err) => toast.error(err.message || 'Failed to load map data'));
  }, [city, location, navigate]);

  useEffect(() => {
    if (!overview?.locations?.length) return;

    const map = L.map(mapRef.current, { attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const bounds = [];
    overview.locations.forEach((loc) => {
      const selected = loc.name === location;
      L.circleMarker([loc.latitude, loc.longitude], {
        radius: selected ? 14 : 10,
        fillColor: RISK_COLORS[loc.risk] || '#6b7280',
        color: selected ? '#111827' : '#fff',
        weight: selected ? 3 : 2,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><br>AQI: <strong>${loc.aqi}</strong><br>Risk: <strong>${loc.risk}</strong>`);
      bounds.push([loc.latitude, loc.longitude]);
    });
    map.fitBounds(bounds, { padding: [30, 30] });

    // Leaflet keeps state on the container; remove it so revisiting the page works
    return () => map.remove();
  }, [overview, location]);

  return (
    <Layout title="Environmental Risk Map" subtitle={`${location}, ${city}`}>
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>Risk Distribution Map</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Current AQI risk for every monitored location in {city}
            {overview && ` (city average AQI ${overview.avg_aqi})`}. Your selected location is outlined.
          </p>
        </div>
        
        {/* Map Container */}
        <div 
          ref={mapRef}
          style={{ 
            height: '420px', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}
        ></div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981' 
            }}></div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: '#f59e0b' 
            }}></div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: '#ef4444' 
            }}></div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              backgroundColor: '#991b1b' 
            }}></div>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Critical Risk</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
