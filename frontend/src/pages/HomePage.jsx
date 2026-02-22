import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

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

          {/* Right: Animated Globe */}
          <div className="order-2 flex justify-center lg:justify-end">
            <AnimatedGlobe />
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

// Optimized Animated Globe Component
function AnimatedGlobe() {
  return (
    <div style={{ 
      width: '500px', 
      height: '500px', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Globe Container */}
      <div style={{
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1e90ff 0%, #4169e1 50%, #0066cc 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(30, 144, 255, 0.4), inset 0 0 80px rgba(0, 0, 0, 0.2)',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}>
        {/* Continents - Simplified shapes */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          animation: 'rotate 40s linear infinite',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}>
          {/* India highlight */}
          <div style={{
            position: 'absolute',
            top: '35%',
            left: '60%',
            width: '40px',
            height: '60px',
            background: '#10b981',
            borderRadius: '40% 60% 60% 40% / 60% 40% 60% 40%',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
            animation: 'pulse 3s ease-in-out infinite',
            willChange: 'opacity'
          }} />
          
          {/* Other landmasses */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '80px',
            height: '50px',
            background: '#3a9d5d',
            borderRadius: '50% 40% 60% 50%',
            opacity: 0.9
          }} />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            width: '60px',
            height: '70px',
            background: '#3a9d5d',
            borderRadius: '60% 40% 50% 60%',
            opacity: 0.9
          }} />
          
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: '70px',
            height: '40px',
            background: '#3a9d5d',
            borderRadius: '40% 60% 50% 50%',
            opacity: 0.9
          }} />
        </div>

        {/* Latitude lines - reduced for performance */}
        {[25, 50, 75].map((top, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${top}%`,
            left: '5%',
            right: '5%',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%'
          }} />
        ))}

        {/* Longitude lines - reduced for performance */}
        {[25, 50, 75].map((left, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '5%',
            bottom: '5%',
            left: `${left}%`,
            width: '1px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%'
          }} />
        ))}

        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Orbiting dots - reduced to 2 for performance */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        animation: 'rotate 25s linear infinite',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}>
        {[0, 180].map((deg, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '10px',
            height: '10px',
            background: '#10b981',
            borderRadius: '50%',
            transform: `rotate(${deg}deg) translateX(225px)`,
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
            willChange: 'opacity'
          }} />
        ))}
      </div>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// Feature Card Component
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
