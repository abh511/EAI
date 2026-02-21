import { useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import useAppStore from '../store/useAppStore';

export default function HomePage() {
  const { city, location } = useAppStore();
  const globeRef = useRef(null);

  useEffect(() => {
    // Simple rotating globe animation using CSS
    const globe = globeRef.current;
    if (globe) {
      let rotation = 0;
      const animate = () => {
        rotation += 0.2;
        globe.style.transform = `rotateY(${rotation}deg)`;
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto px-6">
          {/* Globe Container */}
          <div className="mb-12 flex justify-center">
            <div 
              className="relative"
              style={{
                width: '300px',
                height: '300px',
                perspective: '1000px',
              }}
            >
              <div
                ref={globeRef}
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4), inset 0 0 50px rgba(255,255,255,0.1)',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Globe grid lines */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `
                      repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 29px,
                        rgba(255,255,255,0.1) 29px,
                        rgba(255,255,255,0.1) 30px
                      ),
                      repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 29px,
                        rgba(255,255,255,0.1) 29px,
                        rgba(255,255,255,0.1) 30px
                      )
                    `,
                  }}
                />
                {/* Globe shine */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 50%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <h1 
            className="text-5xl font-bold mb-6"
            style={{
              background: 'linear-gradient(to right, #FF4B2B, #FF416C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome to EnviroWatch AI
          </h1>
          
          <p className="text-xl mb-8" style={{ color: '#555' }}>
            Real-time Environmental Monitoring & AI-Powered Insights
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="card text-center" style={{ padding: '2rem' }}>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF4B2B, #FF416C)' }}
              >
                <i className="fas fa-chart-line text-3xl text-white"></i>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>
                Real-Time Monitoring
              </h3>
              <p className="text-sm" style={{ color: '#8390A2' }}>
                Track air quality, water quality, noise levels, and more across multiple locations
              </p>
            </div>

            <div className="card text-center" style={{ padding: '2rem' }}>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
              >
                <i className="fas fa-brain text-3xl text-white"></i>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>
                AI-Powered Insights
              </h3>
              <p className="text-sm" style={{ color: '#8390A2' }}>
                Get intelligent recommendations and predictions based on environmental data
              </p>
            </div>

            <div className="card text-center" style={{ padding: '2rem' }}>
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
              >
                <i className="fas fa-bell text-3xl text-white"></i>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>
                Smart Alerts
              </h3>
              <p className="text-sm" style={{ color: '#8390A2' }}>
                Receive instant notifications when environmental parameters exceed safe limits
              </p>
            </div>
          </div>

          {/* Current Location Info */}
          {city && location && (
            <div className="mt-12 card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(255, 75, 43, 0.05), rgba(255, 65, 108, 0.05))' }}>
              <div className="flex items-center justify-center gap-3">
                <i className="fas fa-map-marker-alt text-2xl" style={{ color: '#FF4B2B' }}></i>
                <div>
                  <p className="text-sm" style={{ color: '#8390A2' }}>Currently Monitoring</p>
                  <p className="text-xl font-bold" style={{ color: '#333' }}>
                    {location}, {city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="mt-12 grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-xl mt-1" style={{ color: '#10b981' }}></i>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: '#333' }}>7 Environmental Pillars</h4>
                <p className="text-sm" style={{ color: '#8390A2' }}>
                  Air, Water, Noise, Industrial, Waste, Heat, Groundwater
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-xl mt-1" style={{ color: '#10b981' }}></i>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: '#333' }}>48-Hour Forecasting</h4>
                <p className="text-sm" style={{ color: '#8390A2' }}>
                  Predict future environmental conditions with AI
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-xl mt-1" style={{ color: '#10b981' }}></i>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: '#333' }}>What-If Simulator</h4>
                <p className="text-sm" style={{ color: '#8390A2' }}>
                  Test scenarios and predict environmental impact
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-xl mt-1" style={{ color: '#10b981' }}></i>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: '#333' }}>Site Suitability Analysis</h4>
                <p className="text-sm" style={{ color: '#8390A2' }}>
                  AI-powered construction compliance checker
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
    </Layout>
  );
}
