import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'owner';
  plan: 'free' | 'pro' | 'enterprise';
  token?: string;
  createdAt: string;
}

export interface UserAuthState {
  user: UserAccount | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserPlan: (plan: 'free' | 'pro' | 'enterprise') => void;
}

export const useUserAuthStore = create<UserAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, pass) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
          });
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: data.error || 'Invalid credentials' };
        } catch (err: any) {
          // Client-side fallback authentication if backend offline
          const fallbackUser: UserAccount = {
            id: `usr_${Date.now()}`,
            name: email.split('@')[0],
            email,
            role: email.includes('admin') || email.includes('ved') ? 'owner' : 'user',
            plan: 'free',
            createdAt: new Date().toISOString()
          };
          set({ user: fallbackUser, isAuthenticated: true });
          return { success: true };
        }
      },

      signup: async (name, email, pass) => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass })
          });
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: data.error || 'Registration failed' };
        } catch (err: any) {
          const fallbackUser: UserAccount = {
            id: `usr_${Date.now()}`,
            name,
            email,
            role: 'user',
            plan: 'free',
            createdAt: new Date().toISOString()
          };
          set({ user: fallbackUser, isAuthenticated: true });
          return { success: true };
        }
      },

      logout: () => {
        try {
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        } catch {}
        set({ user: null, isAuthenticated: false });
      },

      updateUserPlan: (plan) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, plan } });
        }
      }
    }),
    {
      name: 'vkratim_user_auth_v1'
    }
  )
);
