import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// Landing page for the link in Supabase's password-reset email
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    // The Supabase client turns the token in the link into a recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { border: '1px solid #d1d5db', outline: 'none' };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>Set a new password</h1>
        {!ready ? (
          <p style={{ color: '#6b7280' }}>
            Checking your reset link… If nothing happens, the link may have expired.{' '}
            <a href="/login" style={{ color: '#10b981' }}>Back to login</a>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={inputStyle}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
