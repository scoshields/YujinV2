import { create } from 'zustand';
import { User } from '../types';
import { signIn, signOut as authSignOut, getCurrentUser, getSession } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (user) => {
    const userData = await getCurrentUser();
    set({ user: userData, isAuthenticated: true });
  },
  updateUser: (user) => set({ user }),
  logout: async () => {
    await authSignOut();
    set({ user: null, isAuthenticated: false });
  },
  initAuth: async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const userData = await getCurrentUser();
        if (userData) {
          set({ user: userData, isAuthenticated: true });
          return;
        }
      }
      // If no session or user data, set to not authenticated without error
        set({ user: null, isAuthenticated: false });
    } catch (error) {
      // Silently handle auth errors by setting to not authenticated
      set({ user: null, isAuthenticated: false });
    }
  },
}));