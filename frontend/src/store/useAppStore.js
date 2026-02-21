import { create } from 'zustand';

const useAppStore = create((set) => ({
  // State
  city: localStorage.getItem('ew_city') || '',
  location: localStorage.getItem('ew_location') || '',
  user: null,

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
    localStorage.clear();
    set({ user: null, city: '', location: '' });
  },
}));

export default useAppStore;
