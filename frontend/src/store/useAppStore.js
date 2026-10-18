import { create } from 'zustand';

function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('ew_user')) || null;
  } catch {
    return null;
  }
}

// Demo accounts (@demo.com) skip Supabase, so they have no server-side profile or password
export const isDemoUser = (user) => Boolean(user?.email?.toLowerCase().endsWith('@demo.com'));

const useAppStore = create((set) => ({
  // State
  city: localStorage.getItem('ew_city') || '',
  location: localStorage.getItem('ew_location') || '',
  user: loadStoredUser(),

  // Actions
  setCity: (city) => {
    localStorage.setItem('ew_city', city);
    set({ city });
  },

  setLocation: (location) => {
    localStorage.setItem('ew_location', location);
    set({ location });
  },

  setUser: (user) => {
    if (user && user.token) {
      localStorage.setItem('ew_token', user.token);
      localStorage.setItem('ew_user', JSON.stringify(user));
    }
    set({ user });
  },

  clearUser: () => {
    // Session keys only, so saved demo profiles and preferences survive logout
    ['ew_token', 'ew_user', 'ew_city', 'ew_location'].forEach((key) => localStorage.removeItem(key));
    set({ user: null, city: '', location: '' });
  },
}));

export default useAppStore;
