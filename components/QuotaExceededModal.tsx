'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Key, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { getQuotaState } from '@/lib/quota-tracker';
import { PricingCheckoutModal } from './PricingCheckoutModal';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  onClose
}) => {
  const { geminiApiKey, setGeminiApiKey, generateAiTestsForSelected } = useRunnerStore();
  const [quota, setQuota] = useState(getQuotaState(geminiApiKey));

  const [userKeyInput, setUserKeyInput] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live 1-second interval ticker for cooldown countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQuota(getQuotaState(geminiApiKey));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, geminiApiKey]);

  if (!isOpen) return null;

  const handleSaveUserKey = () => {
    if (!userKeyInput.trim()) return;
    setGeminiApiKey(userKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      generateAiTestsForSelected();
    }, 1200);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-gradient-to-tr from-amber-500/20 via-red-500/20 to-purple-500/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-6 text-left relative my-auto">
        
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Demo AI Key Quota Exceeded (3/3 Calls Reached)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The free shared app demo key limit has been reached. Local Fallback Engine is active.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Informational Status & 5-Hour Cooldown Countdown Banner */}
        <div className="rounded-2xl border border-amber-800/60 bg-amber-950/30 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-amber-300 gap-2">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> What is "Fallback Mode"?
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[10px] border border-amber-500/40 font-mono text-amber-200">
              <Clock className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>Resets automatically in: {quota.cooldownFormatted || '5 hours'}</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            In <strong>Fallback Mode</strong>, the app doesn't crash! It uses a smart local heuristic engine to generate 100% private, zero-latency automated test rules (Status 200 checks, SLA latency bounds &lt;2000ms, Header validations, JSON schema contracts) <strong>without sending any data over external networks</strong>.
          </p>
          <div className="pt-2 border-t border-amber-900/40 text-[11px] text-amber-200/90 font-medium">
            🔒 Demo quota is rate-limited to 3 calls with a <strong>5-hour automatic cooldown</strong> to protect platform infrastructure from API abuse.
          </div>
        </div>

        {/* 2 Interactive Solution Cards */}
        <div className="space-y-4">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
            Choose How You Want to Proceed:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OPTION A: Enter Own Gemini API Key */}
            <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 p-4 space-y-3 flex flex-col justify-between shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-indigo-400" /> Option A: Custom AI Key
                  </span>
                  <span className="rounded bg-emerald-950 text-emerald-400 text-[9px] px-2 py-0.5 font-bold border border-emerald-800">
                    FREE & Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter your free Gemini API key to unlock unlimited AI test generation directly.
                </p>
                <input
                  type="password"
                  placeholder="Paste AI API Key (AIzaSy...)"
                  value={userKeyInput}
                  onChange={(e) => setUserKeyInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveUserKey}
                disabled={!userKeyInput.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-40 flex items-center justify-center space-x-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>API Key Saved! Unlocking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                    <span>Save Key & Unlock Unlimited AI</span>
                  </>
                )}
              </button>
            </div>

            {/* OPTION B: Upgrade to SaaS Pro / Enterprise */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 p-4 space-y-3 flex flex-col justify-between shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-400" /> Option B: Upgrade to Pro
                  </span>
                  <span className="rounded bg-amber-950 text-amber-300 text-[9px] px-2 py-0.5 font-bold border border-amber-800">
                    $9.99 / mo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upgrade to Pro Developer plan to get hosted AI quotas, PowerPoint exports, and team rules vault.
                </p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  setShowPricingModal(true);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center space-x-1.5"
              >
                <Crown className="h-3.5 w-3.5 text-amber-200" />
                <span>View SaaS Subscription Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>

          {/* OPTION C: Continue with Offline Local Fallback */}
          <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-3.5 gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Continue testing using 100% local, offline heuristic rules engine.</span>
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
            >
              Keep Using Fallback
            </button>
          </div>

        </div>

      </div>

      {showPricingModal && (
        <PricingCheckoutModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </div>,
    document.body
  );
};
