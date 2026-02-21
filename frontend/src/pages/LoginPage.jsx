import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '' });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Demo mode bypass
      if (signInData.email.includes('demo') || signInData.email.includes('test')) {
        setUser({
          id: 'demo-user-' + Date.now(),
          email: signInData.email,
          name: signInData.email.split('@')[0],
          token: 'demo-token-' + Date.now(),
        });
        toast.success('Welcome back! (Demo Mode)');
        navigate('/select-city');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        token: data.session.access_token,
      });

      toast.success('Welcome back!');
      navigate('/select-city');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Demo mode bypass
      if (signUpData.email.includes('demo') || signUpData.email.includes('test')) {
        setUser({
          id: 'demo-user-' + Date.now(),
          email: signUpData.email,
          name: signUpData.name || signUpData.email.split('@')[0],
          token: 'demo-token-' + Date.now(),
        });
        toast.success('Account created successfully! (Demo Mode)');
        navigate('/select-city');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.name,
            role: 'citizen',
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // If email confirmation is disabled, user can login immediately
      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: signUpData.name || data.user.email.split('@')[0],
          token: data.session.access_token,
        });
        toast.success('Account created successfully!');
        navigate('/select-city');
      } else {
        // Email confirmation required
        toast.success('Account created! Please check your email to confirm.');
        setIsSignUp(false);
        setSignUpData({ name: '', email: '', password: '' });
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f5f7' }}>
      <div 
        className={`relative overflow-hidden bg-white rounded-lg shadow-lg transition-all duration-700 ${
          isSignUp ? 'right-panel-active' : ''
        }`}
        style={{
          width: '768px',
          maxWidth: '100%',
          minHeight: '480px',
        }}
      >
        {/* Sign Up Form */}
        <div 
          className="absolute top-0 h-full transition-all duration-700 ease-in-out"
          style={{
            left: 0,
            width: '50%',
            opacity: isSignUp ? 1 : 0,
            zIndex: isSignUp ? 5 : 1,
            transform: isSignUp ? 'translateX(100%)' : 'translateX(0)',
          }}
        >
          <form onSubmit={handleSignUp} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h1 className="font-bold text-2xl mb-4">Create Account</h1>
            <div className="flex gap-2 my-5">
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span className="text-xs mb-4">or use your email for registration</span>
            <input
              type="text"
              placeholder="Name"
              value={signUpData.name}
              onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
              className="input"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              className="input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signUpData.password}
              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              className="input"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary mt-4">
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div 
          className="absolute top-0 h-full transition-all duration-700 ease-in-out"
          style={{
            left: 0,
            width: '50%',
            zIndex: 2,
            transform: isSignUp ? 'translateX(100%)' : 'translateX(0)',
          }}
        >
          <form onSubmit={handleSignIn} className="bg-white flex items-center justify-center flex-col px-12 h-full text-center">
            <h1 className="font-bold text-2xl mb-4">Sign in</h1>
            <div className="flex gap-2 my-5">
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="border border-gray-300 rounded-full inline-flex justify-center items-center w-10 h-10 hover:border-[#FF4B2B] transition">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span className="text-xs mb-4">or use your account</span>
            <input
              type="email"
              placeholder="Email"
              value={signInData.email}
              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
              className="input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signInData.password}
              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
              className="input"
              required
            />
            <a href="#" className="text-sm text-gray-700 my-4 hover:text-[#FF4B2B] transition">Forgot your password?</a>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div 
          className="absolute top-0 h-full overflow-hidden transition-transform duration-700 ease-in-out"
          style={{
            left: '50%',
            width: '50%',
            zIndex: 100,
            transform: isSignUp ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <div 
            className="relative h-full w-[200%] transition-transform duration-700 ease-in-out text-white"
            style={{
              background: 'linear-gradient(to right, #FF4B2B, #FF416C)',
              left: '-100%',
              transform: isSignUp ? 'translateX(50%)' : 'translateX(0)',
            }}
          >
            {/* Overlay Left */}
            <div 
              className="absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-in-out"
              style={{
                transform: isSignUp ? 'translateX(0)' : 'translateX(-20%)',
              }}
            >
              <h1 className="font-bold text-3xl mb-4">Welcome Back!</h1>
              <p className="text-sm leading-5 tracking-wide my-5">To keep connected with us please login with your personal info</p>
              <button 
                onClick={() => setIsSignUp(false)}
                className="bg-transparent border-2 border-white rounded-full text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition hover:bg-white hover:text-[#FF4B2B]"
              >
                Sign In
              </button>
            </div>

            {/* Overlay Right */}
            <div 
              className="absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-700 ease-in-out"
              style={{
                transform: isSignUp ? 'translateX(20%)' : 'translateX(0)',
              }}
            >
              <h1 className="font-bold text-3xl mb-4">Hello, Friend!</h1>
              <p className="text-sm leading-5 tracking-wide my-5">Enter your personal details and start journey with us</p>
              <button 
                onClick={() => setIsSignUp(true)}
                className="bg-transparent border-2 border-white rounded-full text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition hover:bg-white hover:text-[#FF4B2B]"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Font Awesome CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css" />
    </div>
  );
}
