import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface SubscriptionState {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  subscriptionId: string | null;
  subscribedAt: string | null;
  expiresAt: string | null;
  paymentProvider: 'stripe' | 'paypal' | null;

  // Actions
  setPlan: (plan: SubscriptionPlan, provider?: 'stripe' | 'paypal') => void;
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  cancelSubscription: () => void;
  
  // Feature Gating Checks
  canExportPptx: () => boolean;
  canUseUnlimitedAi: () => boolean;
  canUseCustomVault: () => boolean;
  canUseMfaAdmin: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      billingCycle: 'monthly',
      subscriptionId: null,
      subscribedAt: null,
      expiresAt: null,
      paymentProvider: null,

      setPlan: (plan, provider = 'stripe') => set({
        plan,
        paymentProvider: provider,
        subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        subscribedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }),

      setBillingCycle: (cycle) => set({ billingCycle: cycle }),

      cancelSubscription: () => set({
        plan: 'free',
        subscriptionId: null,
        subscribedAt: null,
        expiresAt: null,
        paymentProvider: null
      }),

      canExportPptx: () => get().plan !== 'free',
      canUseUnlimitedAi: () => get().plan !== 'free',
      canUseCustomVault: () => get().plan !== 'free',
      canUseMfaAdmin: () => true, // All users can manage MFA
    }),
    {
      name: 'runner_subscription_store_v1'
    }
  )
);
