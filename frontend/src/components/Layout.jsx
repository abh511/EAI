import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

export default function Layout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const { city, location, clearUser } = useAppStore();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode was previously enabled
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    if (newMode) {
      document.body.classList.add('dark-mode');
      toast.success('Dark mode enabled');
    } else {
      document.body.classList.remove('dark-mode');
      toast.success('Light mode enabled');
    }
  };

  const handleLogout = () => {
    clearUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { icon: 'fas fa-tachometer-alt', label: 'Dashboard', path: '/dashboard' },
    { icon: 'fas fa-home', label: 'Home', path: '/home' },
    { icon: 'fas fa-map-marked-alt', label: 'Map View', path: '/map' },
    { icon: 'fas fa-chart-line', label: '48hr Forecast', path: '/forecast' },
    { icon: 'fas fa-flask', label: 'Simulator', path: '/simulator' },
    { icon: 'fas fa-building', label: 'Site Analyzer', path: '/site-analyzer' },
    { icon: 'fas fa-bell', label: 'Alerts', path: '/alerts' },
    { icon: 'fas fa-comment-alt', label: 'Report Issue', path: '/grievance' },
    { icon: 'fas fa-map-marker-alt', label: 'Change Location', path: '/select-city' },
  ];

  return (
    <div className="flex w-full min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Sidebar */}
      <aside 
        className="fixed h-full left-0 top-0 z-50 bg-white"
        style={{
          width: '280px',
          borderRight: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div className="h-20 flex items-center justify-center">
          <h2 className="text-2xl font-extrabold tracking-wider" style={{ color: '#333' }}>
            EnviroWatch
          </h2>
        </div>
        <ul className="mt-5">
          {navItems.map((item, idx) => (
            <li key={idx}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`nav-link ${window.location.pathname === item.path ? 'active' : ''}`}
              >
                <i className={item.icon}></i>
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="nav-link"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col" style={{ marginLeft: '280px' }}>
        {/* Header */}
        <header 
          className="bg-white h-20 flex justify-between items-center px-8 z-40"
          style={{ boxShadow: '0 2px 15px rgba(0,0,0,0.04)' }}
        >
          <div 
            className="flex items-center overflow-hidden px-4 rounded-full"
            style={{
              border: '1px solid #eee',
              height: '40px',
              width: '300px',
              backgroundColor: '#f6f5f7',
            }}
          >
            <i className="fas fa-search text-gray-400"></i>
            <input
              type="search"
              placeholder="Search here..."
              className="h-full w-full border-none outline-none pl-3 text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h4 className="font-semibold text-sm" style={{ color: '#333' }}>
                {location || 'Select Location'}
              </h4>
              <small className="text-xs" style={{ color: '#8390A2' }}>
                {city || 'No City Selected'}
              </small>
            </div>
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100"
              style={{ border: '1px solid #eee' }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <i className="fas fa-sun text-yellow-500"></i>
              ) : (
                <i className="fas fa-moon text-gray-600"></i>
              )}
            </button>
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              className="rounded-full"
              style={{ width: '40px', height: '40px' }}
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          {title && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold" style={{ color: '#333' }}>{title}</h1>
              {subtitle && <p className="text-sm mt-1" style={{ color: '#8390A2' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
    </div>
  );
}
