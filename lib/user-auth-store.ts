import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAdminStore } from '@/lib/admin-store';

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
  setUser: (user: UserAccount) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, pass: string, phone?: string, otpCode?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserPlan: (plan: 'free' | 'pro' | 'enterprise') => void;
}

export const useUserAuthStore = create<UserAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: true });
        if (user.role === 'owner') {
          useAdminStore.getState().setWorkspaceMode('full');
        } else {
          useAdminStore.getState().setWorkspaceMode('light');
        }
      },

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
            if (data.user.role === 'owner') {
              useAdminStore.getState().setWorkspaceMode('full');
            } else {
              useAdminStore.getState().setWorkspaceMode('light');
            }
            return { success: true };
          }
          return { success: false, message: data.error || 'Account not found or invalid password. Please create an account first.' };
        } catch (err: any) {
          return { success: false, message: 'Server connection error. Please try again.' };
        }
      },

      signup: async (name, email, pass, phone, otpCode) => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass, phone, otpCode })
          });
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, isAuthenticated: true });
            if (data.user.role === 'owner') {
              useAdminStore.getState().setWorkspaceMode('full');
            } else {
              useAdminStore.getState().setWorkspaceMode('light');
            }
            return { success: true };
          }
          return { success: false, message: data.error || 'Registration failed' };
        } catch (err: any) {
          return { success: false, message: 'Server error during account registration. Please try again.' };
        }
      },

      logout: () => {
        try {
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        } catch {}
        set({ user: null, isAuthenticated: false });
        useAdminStore.getState().setWorkspaceMode('light');
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
