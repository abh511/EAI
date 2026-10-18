import { useState, useEffect } from 'react';
import useAppStore, { isDemoUser } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const { city, location, user: sessionUser } = useAppStore();
  const isDemo = isDemoUser(sessionUser);
  const demoKey = `ew_demo_profile:${sessionUser?.email}`;
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [photoURL, setPhotoURL] = useState(null);

  useEffect(() => {
    // Load once on mount; the signed-in user doesn't change while this page is open
    loadUserProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo accounts have no Supabase user, so their profile lives in this browser
  const readDemoProfile = () => {
    try {
      return JSON.parse(localStorage.getItem(demoKey)) || {};
    } catch {
      return {};
    }
  };

  const saveProfile = async (fields) => {
    if (isDemo) {
      localStorage.setItem(demoKey, JSON.stringify({ ...readDemoProfile(), ...fields }));
      return;
    }
    const { error } = await supabase.auth.updateUser({ data: fields });
    if (error) throw error;
  };

  const loadUserProfile = async () => {
    if (isDemo) {
      const saved = readDemoProfile();
      setEmail(sessionUser.email);
      setFullName(saved.full_name ?? sessionUser.name ?? '');
      setUsername(saved.username || '');
      setMobileNumber(saved.mobile || '');
      setAddress(saved.address || '');
      setPhotoURL(saved.photo_url || null);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
        setFullName(user.user_metadata?.full_name || '');
        setUsername(user.user_metadata?.username || '');
        setMobileNumber(user.user_metadata?.mobile || '');
        setAddress(user.user_metadata?.address || '');
        setPhotoURL(user.user_metadata?.photo_url || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const photoDataURL = event.target.result;
      setPhotoURL(photoDataURL);

      try {
        await saveProfile({ photo_url: photoDataURL });
        toast.success('Profile photo updated!');
      } catch (error) {
        console.error('Error saving photo:', error);
        // A large photo can exceed the browser's storage quota for demo accounts
        toast.error(isDemo ? 'Photo is too large to save in the browser. Try a smaller image.' : 'Error saving photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setPhotoURL(null);

    try {
      await saveProfile({ photo_url: null });
      toast.success('Profile photo removed!');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Error removing photo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveProfile({
        full_name: fullName,
        username: username,
        mobile: mobileNumber,
        address: address
      });
      toast.success(isDemo ? 'Profile saved in this browser (demo account)' : 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Profile" subtitle={`${location}, ${city}`}>
      <div className="w-full px-8">
        {/* Profile Photo Section */}
        <div className="card mb-5">
          <h3 className="text-lg font-bold mb-5 pb-3" style={{ 
            color: '#111827',
            borderBottom: '2px solid #10b981'
          }}>
            <i className="fas fa-camera mr-2"></i>
            Profile Photo
          </h3>

          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile"
                  className="rounded-full object-cover"
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '3px solid #10b981'
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center text-5xl font-bold text-white"
                  style={{
                    width: '120px',
                    height: '120px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '3px solid #10b981'
                  }}
                >
                  {getInitials(fullName || email)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="file"
                id="photoInput"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <button
                onClick={() => document.getElementById('photoInput').click()}
                className="px-4 py-2 rounded-lg font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <i className="fas fa-upload mr-2"></i>
                Upload Photo
              </button>
              <button
                onClick={handleRemovePhoto}
                className="px-4 py-2 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-trash mr-2"></i>
                Remove Photo
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="card">
          <h3 className="text-lg font-bold mb-5 pb-3" style={{ 
            color: '#111827',
            borderBottom: '2px solid #10b981'
          }}>
            <i className="fas fa-user-edit mr-2"></i>
            Profile Information
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none'
                  }}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none'
                  }}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    cursor: 'not-allowed'
                  }}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    outline: 'none'
                  }}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg resize-y"
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #d1d5db',
                  outline: 'none',
                  minHeight: '80px'
                }}
                placeholder="Enter your address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold transition-all"
              style={{
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                boxShadow: loading ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Saving...
                </span>
              ) : (
                <span>
                  <i className="fas fa-save mr-2"></i>
                  Save Profile
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
