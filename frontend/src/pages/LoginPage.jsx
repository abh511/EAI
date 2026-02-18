import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, User, Leaf } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await authAPI.login(formData.email, formData.password);
        const { access_token, user_id, email, full_name } = response.data;
        
        localStorage.setItem('ew_token', access_token);
        localStorage.setItem('ew_user_id', user_id);
        localStorage.setItem('ew_email', email);
        if (full_name) localStorage.setItem('ew_full_name', full_name);
        
        toast.success('Welcome back! 🎉');
        navigate('/select-city');
      } else {
        const response = await authAPI.register(formData.email, formData.password, formData.full_name);
        const { access_token, user_id, email, full_name } = response.data;
        
        localStorage.setItem('ew_token', access_token);
        localStorage.setItem('ew_user_id', user_id);
        localStorage.setItem('ew_email', email);
        if (full_name) localStorage.setItem('ew_full_name', full_name);
        
        toast.success('Account created successfully! 🎉');
        navigate('/select-city');
      }
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pillar-air/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-500/50">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">EnviroWatch AI</h1>
          <p className="text-gray-400">Environmental Risk Detection for Indian Cities</p>
        </div>

        {/* Auth Card */}
        <div className="card-glass">
          {/* Toggle Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-800/50 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isLogin
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isLogin
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-1" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  {isLogin ? 'Login' : 'Create Account'}
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-700/50 text-center text-sm text-gray-400">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-brand-400 hover:text-brand-300 font-medium"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-brand-400 hover:text-brand-300 font-medium"
                >
                  Login here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-xs">
            <div className="text-2xl mb-1">🌍</div>
            <div className="text-gray-400">7 Pillars</div>
          </div>
          <div className="text-xs">
            <div className="text-2xl mb-1">🤖</div>
            <div className="text-gray-400">AI Powered</div>
          </div>
          <div className="text-xs">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-gray-400">Real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
