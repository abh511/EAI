import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Layout from '../components/Layout';

export default function MapPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();

  useEffect(() => {
    if (!city || !location) {
      navigate('/select-city');
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);

    function initMap() {
      if (!window.L) return;

      // Initialize map (centered on India - Pune/Mumbai area)
      const map = window.L.map('map', { attributionControl: false }).setView([18.5204, 73.8567], 12);

      // OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Sample risk markers for Indian cities
      const markers = [
        { lat: 18.5204, lng: 73.8567, area: 'Pune Downtown', risk: 'High', count: 24 },
        { lat: 18.5314, lng: 73.8446, area: 'Koregaon Park', risk: 'Low', count: 3 },
        { lat: 18.5642, lng: 73.7769, area: 'Hinjewadi', risk: 'Medium', count: 7 },
        { lat: 18.4632, lng: 73.8671, area: 'Hadapsar', risk: 'High', count: 13 }
      ];

      function colorForRisk(risk) {
        if (risk === 'High') return '#ef4444';
        if (risk === 'Medium') return '#f59e0b';
        return '#10b981';
      }

      markers.forEach(m => {
        const marker = window.L.circleMarker([m.lat, m.lng], {
          radius: 10,
          fillColor: colorForRisk(m.risk),
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`<strong>${m.area}</strong><br>Risk: <strong>${m.risk}</strong><br>Violations: <strong>${m.count}</strong>`);
      });
    }

    return () => {
      // Cleanup
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.innerHTML = '';
      }
    };
  }, [city, location, navigate]);

  return (
    <Layout title="Environmental Risk Map" subtitle={`${location}, ${city}`}>
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>Risk Distribution Map</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Interactive map showing environmental risk levels across different areas
          </p>
        </div>
        
        {/* Map Container */}
        <div 
          id="map" 
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
        </div>
      </div>
    </Layout>
  );
}
