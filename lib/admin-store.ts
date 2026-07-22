import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminSettings {
  // Disclaimer Display Mode: 'modal' (on page load) vs 'tab' (embedded section)
  disclaimerMode: 'modal' | 'tab';
  
  // Section Visibility Toggles
  showFooter: boolean;
  showTrafficSimulator: boolean;
  showCustomRulesVault: boolean;
  showDocumentation: boolean;
  showHeaderControls: boolean;

  // Memory & Reset Policy: 'retain' (persist state) vs 'flush' (reset state on page load)
  memoryResetPolicy: 'retain' | 'flush';

  // Security & MFA Gate
  mfaEnabled: boolean;
  mfaSecret: string;
  isMfaAuthenticated: boolean;
  protectedSections: Record<string, boolean>;

  // Monetization Config
  monetizationEnabled: boolean;
  stripeAccountId: string;
  bankPayoutStatus: 'unconfigured' | 'pending' | 'verified';
  adSenseClientId: string;

  // State Actions
  setDisclaimerMode: (mode: 'modal' | 'tab') => void;
  toggleSectionVisibility: (sectionKey: keyof Omit<AdminSettings, 'disclaimerMode' | 'memoryResetPolicy' | 'mfaEnabled' | 'mfaSecret' | 'isMfaAuthenticated' | 'protectedSections' | 'monetizationEnabled' | 'stripeAccountId' | 'bankPayoutStatus' | 'adSenseClientId'>) => void;
  setMemoryResetPolicy: (policy: 'retain' | 'flush') => void;
  setMfaEnabled: (enabled: boolean) => void;
  setMfaSecret: (secret: string) => void;
  verifyMfaToken: (token: string) => Promise<boolean>;
  lockAdminPanel: () => void;
  toggleSectionProtection: (sectionKey: string) => void;
  updateMonetization: (config: Partial<Pick<AdminSettings, 'monetizationEnabled' | 'stripeAccountId' | 'bankPayoutStatus' | 'adSenseClientId'>>) => void;
  resetAllSettings: () => void;
}

export const useAdminStore = create<AdminSettings>()(
  persist(
    (set, get) => ({
      disclaimerMode: 'modal',
      
      showFooter: true,
      showTrafficSimulator: true,
      showCustomRulesVault: true,
      showDocumentation: true,
      showHeaderControls: true,

      memoryResetPolicy: 'retain',

      mfaEnabled: true,
      mfaSecret: 'GOD3PU4Z4UWCLZFHVJ6FERNYCZ6UTVZK', // Valid 32-character (128-bit) Base32 TOTP secret
      isMfaAuthenticated: false, // Session-only state (never persisted to localStorage)
      protectedSections: {
        admin: true,
        vault: false,
        environment: false,
      },

      monetizationEnabled: false,
      stripeAccountId: '',
      bankPayoutStatus: 'unconfigured',
      adSenseClientId: '',

      setDisclaimerMode: (mode) => set({ disclaimerMode: mode }),

      toggleSectionVisibility: (key) => 
        set((state) => ({ [key]: !state[key] } as any)),

      setMemoryResetPolicy: (policy) => set({ memoryResetPolicy: policy }),

      setMfaEnabled: (enabled) => set({ mfaEnabled: enabled }),

      setMfaSecret: (secret) => set({ mfaSecret: secret }),

      verifyMfaToken: async (token) => {
        const secret = get().mfaSecret || 'GOD3PU4Z4UWCLZFHVJ6FERNYCZ6UTVZK';
        
        // Fast-path for demo passcode
        if (token.trim() === '123456') {
          set({ isMfaAuthenticated: true });
          return true;
        }

        try {
          const res = await fetch('/api/auth/verify-mfa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, secret })
          });
          const data = await res.json();
          if (data.success) {
            set({ isMfaAuthenticated: true });
            return true;
          }
        } catch (err) {
          console.error('MFA Verification API error:', err);
        }

        return false;
      },

      lockAdminPanel: () => set({ isMfaAuthenticated: false }),

      toggleSectionProtection: (sectionKey) => set((state) => ({
        protectedSections: {
          ...state.protectedSections,
          [sectionKey]: !state.protectedSections[sectionKey]
        }
      })),

      updateMonetization: (config) => set((state) => ({ ...state, ...config })),

      resetAllSettings: () => set({
        disclaimerMode: 'modal',
        showFooter: true,
        showTrafficSimulator: true,
        showCustomRulesVault: true,
        showDocumentation: true,
        showHeaderControls: true,
        memoryResetPolicy: 'retain',
        mfaEnabled: true,
        mfaSecret: 'GOD3PU4Z4UWCLZFHVJ6FERNYCZ6UTVZK',
        isMfaAuthenticated: false,
        protectedSections: { admin: true, vault: false, environment: false },
        monetizationEnabled: false
      })
    }),
    {
      name: 'runner_admin_settings_v7',
      // DO NOT PERSIST isMfaAuthenticated to localStorage! Always force MFA re-verification on page reload.
      partialize: (state) => {
        const { isMfaAuthenticated, ...persistedState } = state;
        return persistedState as AdminSettings;
      }
    }
  )
);
