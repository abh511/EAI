import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Load scripts directly in head
    const scripts = [
      'https://www.amcharts.com/lib/4/core.js',
      'https://www.amcharts.com/lib/4/maps.js',
      'https://www.amcharts.com/lib/4/geodata/worldLow.js',
      'https://www.amcharts.com/lib/4/themes/animated.js'
    ];

    let loadedCount = 0;

    scripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) {
          setTimeout(initGlobe, 100);
        }
      };
      document.head.appendChild(script);
    });

    function initGlobe() {
      if (!window.am4core || !window.am4maps) return;

      window.am4core.useTheme(window.am4themes_animated);

      const chart = window.am4core.create("chartdiv", window.am4maps.MapChart);
      chart.geodata = window.am4geodata_worldLow;
      chart.projection = new window.am4maps.projections.Orthographic();
      chart.panBehavior = "rotateLongLat";
      chart.deltaLatitude = -20;
      chart.padding(20, 20, 20, 20);

      const polygonSeries = chart.series.push(new window.am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;

      const polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.tooltipText = "{name}";
      polygonTemplate.fill = window.am4core.color("#3a9d5d");
      polygonTemplate.stroke = window.am4core.color("#2d7a47");
      polygonTemplate.strokeWidth = 0.5;

      const graticuleSeries = chart.series.push(new window.am4maps.GraticuleSeries());
      graticuleSeries.mapLines.template.line.stroke = window.am4core.color("#ffffff");
      graticuleSeries.mapLines.template.line.strokeOpacity = 0.08;
      graticuleSeries.fitExtent = false;

      chart.backgroundSeries.mapPolygons.template.polygon.fillOpacity = 1;
      chart.backgroundSeries.mapPolygons.template.polygon.fill = window.am4core.color("#1e90ff");

      const hs = polygonTemplate.states.create("hover");
      hs.properties.fill = chart.colors.getIndex(0).brighten(-0.5);

      setTimeout(function() {
        chart.animate({
          property: "deltaLongitude",
          to: 100000
        }, 20000000);
      }, 3000);
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
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
            onClick={() => navigate('/select-city')}
            className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            Get Started <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="order-1">
            <h2 className="font-black mb-3" style={{ 
              fontSize: '3.5rem',
              lineHeight: '1.1',
              color: '#111827',
              letterSpacing: '-0.02em'
            }}>
              AI-Powered<br />
              Environmental<br />
              Monitoring
            </h2>
            <p className="text-xl mb-6" style={{ color: '#4b5563', lineHeight: '1.6' }}>
              Real-time risk detection and 48-hour forecasting for Indian cities using advanced machine learning
            </p>
            <button
              onClick={() => navigate('/select-city')}
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
              }}
            >
              Start Monitoring <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>

          {/* Right: Globe */}
          <div className="order-2 flex justify-center lg:justify-end">
            <div 
              id="chartdiv" 
              style={{ 
                width: '100%',
                maxWidth: '500px',
                height: '500px',
                backgroundColor: '#ffffff',
                borderRadius: '16px'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            title="AI Risk Prediction"
            description="Machine learning models trained on 10,000+ data points deliver 99.75% accurate environmental risk assessments"
          />
          <FeatureCard
            title="48-Hour Forecasting"
            description="Advanced algorithms predict environmental conditions two days ahead for proactive decision-making"
          />
          <FeatureCard
            title="7-Pillar Monitoring"
            description="Comprehensive tracking of Air, Water, Noise, Industrial, Waste, Heat, and Groundwater quality"
          />
        </div>
      </div>
    </div>
  );
}

// Feature Card Component - Clean without icon boxes
function FeatureCard({ title, description }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="p-8 rounded-2xl transition-all duration-300 cursor-pointer"
      style={{ 
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 12px 24px rgba(0, 0, 0, 0.1)' 
          : '0 4px 6px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 className="text-2xl font-bold mb-3" style={{ color: '#111827' }}>
        {title}
      </h3>
      <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  );
}
