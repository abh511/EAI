import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore, { isDemoUser } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { city, location, user } = useAppStore();
  const isDemo = isDemoUser(user);
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'changePassword', 'forgotPassword'
  const [showOtpSection, setShowOtpSection] = useState(false);
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  // Notification preferences, remembered in this browser
  const savedPrefs = (() => {
    try {
      return JSON.parse(localStorage.getItem('ew_notification_prefs')) || {};
    } catch {
      return {};
    }
  })();
  const [emailNotifications, setEmailNotifications] = useState(savedPrefs.email ?? true);
  const [smsNotifications, setSmsNotifications] = useState(savedPrefs.sms ?? false);
  const [pushNotifications, setPushNotifications] = useState(savedPrefs.push ?? true);

  useEffect(() => {
    localStorage.setItem('ew_notification_prefs', JSON.stringify({
      email: emailNotifications, sms: smsNotifications, push: pushNotifications,
    }));
  }, [emailNotifications, smsNotifications, pushNotifications]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      // Confirm the current password before allowing a change
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Your session has expired. Please log in again.');
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentView('menu');
    } catch (error) {
      toast.error(error.message || 'Error updating password');
      console.error(error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent! Check your inbox.');
      setShowOtpSection(true);
    } catch (error) {
      toast.error(error.message || 'Error sending reset email');
      console.error(error);
    }
  };

  return (
    <Layout title="Settings" subtitle={`${location}, ${city}`}>
      <div className="w-full px-8">
        {/* Security Section */}
        <div className="card mb-5">
          <h3 className="text-lg font-bold mb-5 pb-3" style={{ 
            color: '#111827',
            borderBottom: '2px solid #10b981'
          }}>
            <i className="fas fa-lock mr-2"></i>
            Security
          </h3>

          {isDemo && (
            <p className="text-sm p-4 rounded-lg" style={{ backgroundColor: '#f6f5f7', color: '#4b5563' }}>
              <i className="fas fa-info-circle mr-2"></i>
              You are using a demo account, which has no password. Sign up with your own email to manage a password.
            </p>
          )}

          {!isDemo && currentView === 'menu' && (
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('changePassword')}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <i className="fas fa-key mr-2"></i>
                Change Password
              </button>
              <button
                onClick={() => setCurrentView('forgotPassword')}
                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <i className="fas fa-envelope mr-2"></i>
                Forgot Password
              </button>
            </div>
          )}

          {!isDemo && currentView === 'changePassword' && (
            <div>
              <button
                onClick={() => setCurrentView('menu')}
                className="mb-4 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </button>
              
              <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      outline: 'none'
                    }}
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      outline: 'none'
                    }}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      outline: 'none'
                    }}
                    placeholder="Confirm new password"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <i className="fas fa-key mr-2"></i>
                  Update Password
                </button>
              </form>
            </div>
          )}

          {!isDemo && currentView === 'forgotPassword' && (
            <div>
              <button
                onClick={() => {
                  setCurrentView('menu');
                  setShowOtpSection(false);
                }}
                className="mb-4 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </button>
              
              <form onSubmit={handleForgotPassword}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      outline: 'none'
                    }}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Reset Link
                </button>
              </form>

              {showOtpSection && (
                <div className="mt-6 pt-6" style={{ borderTop: '2px solid #e5e7eb' }}>
                  <div 
                    className="p-4 rounded-lg mb-4"
                    style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid #10b981'
                    }}
                  >
                    <p className="text-sm" style={{ color: '#059669' }}>
                      <i className="fas fa-info-circle mr-2"></i>
                      Check your email and click the password reset link to complete the process.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="card">
          <h3 className="text-lg font-bold mb-5 pb-3" style={{ 
            color: '#111827',
            borderBottom: '2px solid #10b981'
          }}>
            <i className="fas fa-bell mr-2"></i>
            Notifications
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#111827' }}>
                Email Notifications
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={emailNotifications}
                  onChange={(e) => {
                    setEmailNotifications(e.target.checked);
                    toast.success(e.target.checked ? 'Email notifications enabled' : 'Email notifications disabled');
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#111827' }}>
                SMS Notifications
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={smsNotifications}
                  onChange={(e) => {
                    setSmsNotifications(e.target.checked);
                    toast.success(e.target.checked ? 'SMS notifications enabled' : 'SMS notifications disabled');
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#111827' }}>
                Push Notifications
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={pushNotifications}
                  onChange={(e) => {
                    setPushNotifications(e.target.checked);
                    toast.success(e.target.checked ? 'Push notifications enabled' : 'Push notifications disabled');
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
