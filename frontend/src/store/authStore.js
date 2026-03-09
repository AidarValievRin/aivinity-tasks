import { create } from 'zustand';
import { authApi } from '../api/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const res = await authApi.me();
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    } catch {
      try {
        const res = await authApi.refresh();
        localStorage.setItem('accessToken', res.data.accessToken);
        set({ user: res.data.user, isAuthenticated: true, loading: false });
      } catch {
        localStorage.removeItem('accessToken');
        set({ loading: false });
      }
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (username, email, password) => {
    const res = await authApi.register({ username, email, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('accessToken');
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => ({ user: { ...state.user, ...userData } }));
  },
}));
