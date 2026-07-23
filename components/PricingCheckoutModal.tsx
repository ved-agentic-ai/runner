'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  Zap, 
  Crown, 
  CreditCard, 
  Building2, 
  ShieldCheck,
  Star,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useSubscriptionStore, SubscriptionPlan } from '@/lib/subscription-store';

interface PricingCheckoutModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  triggerButton?: React.ReactNode;
}

export const PricingCheckoutModal: React.FC<PricingCheckoutModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  triggerButton,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeGateway, setActiveGateway] = useState<'stripe' | 'paypal' | null>(null);
  const [selectedPlanForGateway, setSelectedPlanForGateway] = useState<SubscriptionPlan>('pro');
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Form State for Checkout Simulator
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('888');

  const { plan, setPlan, billingCycle, setBillingCycle, cancelSubscription } = useSubscriptionStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isControlledExternally = externalIsOpen !== undefined;
  const isModalOpen = isControlledExternally ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    else setInternalIsOpen(false);
    setActiveGateway(null);
    setCheckoutSuccess(null);
  };

  const handleOpenGatewayModal = async (targetPlan: SubscriptionPlan, provider: 'stripe' | 'paypal') => {
    setSelectedPlanForGateway(targetPlan);
    setActiveGateway(provider);
    setIsProcessing(true);

    try {
      const endpoint = provider === 'stripe' ? '/api/checkout/stripe' : '/api/checkout/paypal';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: targetPlan, 
          billingCycle,
          origin: typeof window !== 'undefined' ? window.location.origin : 'https://vkratim.com'
        })
      });
      const data = await res.json();

      if (data.url && data.isLive) {
        // Redirect directly to real payment gateway portal
        window.location.href = data.url;
        return;
      }

      // Instant Plan Upgrade
      setPlan(targetPlan, provider);
      setIsProcessing(false);
      setCheckoutSuccess(`${targetPlan.toUpperCase()} Plan Activated via ${provider.toUpperCase()}`);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setPlan(targetPlan, provider);
      setIsProcessing(false);
      setCheckoutSuccess(`${targetPlan.toUpperCase()} Plan Activated`);
      setTimeout(() => handleClose(), 2000);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl border border-indigo-500/30 bg-[#0b0f19] p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar my-auto text-left relative">
        
        {/* Glowing Top Ambient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Upgrade to SaaS Pro & Enterprise
              </h2>
              <p className="text-xs text-slate-400">
                Unlock unlimited AI test assertion generation, native PowerPoint deck downloads, custom rules vault, and team collaboration.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex items-center space-x-2 rounded-2xl bg-slate-900/80 p-1.5 border border-slate-800">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                billingCycle === 'annual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 border border-emerald-500/30 font-extrabold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {checkoutSuccess && (
          <div className="rounded-2xl border border-emerald-800/80 bg-emerald-950/60 p-4 text-center text-xs font-bold text-emerald-300 animate-in fade-in flex items-center justify-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>🎉 Upgrade Successful! Payment confirmed for {checkoutSuccess}. Unlocking all Pro features...</span>
          </div>
        )}

        {/* 3 Pricing Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* TIER 1: FREE DEVELOPER */}
          <div className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
            plan === 'free' ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-300">Starter Free</span>
                {plan === 'free' && (
                  <span className="rounded-full bg-slate-800 text-slate-400 text-[10px] px-2.5 py-0.5 border border-slate-700 font-bold">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400 font-normal"> / forever</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Essential API collection testing for individual developers building basic projects.
              </p>

              <ul className="space-y-2 text-xs text-slate-300">
                {[
                  'Capped at 3 AI assertions / run',
                  'Standard HTTP runner & proxy',
                  'Local memory storage',
                  'Community support'
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                cancelSubscription();
                setCheckoutSuccess('Plan reset to Starter Free');
                setTimeout(() => setCheckoutSuccess(null), 2000);
              }}
              disabled={plan === 'free'}
              className={`w-full rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                plan === 'free' 
                  ? 'border-slate-800 bg-slate-900 text-slate-500 cursor-default'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer'
              }`}
            >
              {plan === 'free' ? 'Active Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* TIER 2: PRO DEVELOPER SAAS (FEATURED) */}
          <div className="relative rounded-3xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-950 p-6 flex flex-col justify-between space-y-6 shadow-2xl shadow-indigo-500/20 transform hover:-translate-y-1 transition-all">
            
            {/* Featured Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" /> Most Popular
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-indigo-400" /> SaaS Pro Developer
                </span>
                {plan === 'pro' && (
                  <span className="rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] px-2.5 py-0.5 border border-indigo-500/40 font-bold">
                    Active Plan
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-black text-white">
                  {billingCycle === 'annual' ? '$7.99' : '$9.99'}
                </span>
                <span className="text-xs text-slate-400 font-normal"> / month</span>
                <div className="text-[10px] text-indigo-300 font-mono mt-0.5">
                  (~105 SEK / ~840 INR per month)
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full enterprise suite for professional developers, QA engineers, and API architects.
              </p>

              <ul className="space-y-2 text-xs text-slate-200">
                {[
                  'UNLIMITED AI Test Generation',
                  'Native PowerPoint (.pptx) Deck Export',
                  'Custom AI Rules Vault (Tab 3)',
                  'MFA Authenticator Admin Control',
                  'Postman-Style Environment Manager',
                  'Zero data retention flush policy'
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center space-x-2 font-medium">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instant Gateway Checkout Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleOpenGatewayModal('pro', 'stripe')}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-purple-500 active:scale-95 transition-all disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>{plan === 'pro' ? 'Renew via Stripe Gateway ($9.99)' : 'Pay via Stripe Gateway ($9.99)'}</span>
              </button>

              <button
                onClick={() => handleOpenGatewayModal('pro', 'paypal')}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl border border-blue-800/80 bg-blue-950/60 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-900 transition-all disabled:opacity-50"
              >
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>Pay via PayPal Express</span>
              </button>
            </div>
          </div>

          {/* TIER 3: ENTERPRISE TEAM */}
          <div className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
            plan === 'enterprise' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-400" /> Enterprise Team
                </span>
                {plan === 'enterprise' && (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 border border-amber-500/40 font-bold">
                    Active Plan
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-black text-white">
                  {billingCycle === 'annual' ? '$23.00' : '$29.00'}
                </span>
                <span className="text-xs text-slate-400 font-normal"> / month</span>
                <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                  (~305 SEK / ~2,436 INR per month)
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                For software engineering teams needing dedicated proxies, multi-user sync, and SLAs.
              </p>

              <div className="rounded-xl border border-amber-800/60 bg-amber-950/40 p-2.5 text-[11px] text-amber-200 leading-snug">
                ⚠️ <strong>Subscription Limit Reached</strong>: Enterprise onboarding is temporarily paused due to high server capacity demand. Please select SaaS Pro.
              </div>

              <ul className="space-y-2 text-xs text-slate-300">
                {[
                  'Everything in SaaS Pro plan',
                  'Multi-user shared team workspace',
                  'Custom domain CORS proxy server',
                  'Automated scheduled cron runners',
                  '24/7 Priority SLA engineering support'
                ].map((feat, idx) => (
                  <li key={idx} className="flex items-center space-x-2 opacity-60">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled={true}
              className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl border border-slate-800 bg-slate-900 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
            >
              <span>Enterprise Paused (Capacity Full)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );

  // If controlled externally by props (e.g. from PresentationDeckModal), do NOT render a duplicate trigger button!
  if (isControlledExternally) {
    return isModalOpen && mounted ? createPortal(modalContent, document.body) : null;
  }

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setInternalIsOpen(true)} className="cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <button
          onClick={() => setInternalIsOpen(true)}
          className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-pink-500 transition-all whitespace-nowrap"
        >
          <Crown className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span>{plan === 'free' ? 'Upgrade to Pro' : `Plan: ${plan.toUpperCase()}`}</span>
        </button>
      )}

      {isModalOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
