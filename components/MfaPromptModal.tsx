'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Smartphone, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

interface MfaPromptModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MfaPromptModal: React.FC<MfaPromptModalProps> = ({
  isOpen,
  sectionTitle,
  onClose,
  onSuccess,
}) => {
  const [mounted, setMounted] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [mfaError, setMfaError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { verifyMfaToken } = useAdminStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput) return;

    setIsVerifying(true);
    const success = await verifyMfaToken(otpInput);
    setIsVerifying(false);

    if (!success) {
      setMfaError(true);
    } else {
      setMfaError(false);
      setOtpInput('');
      onSuccess();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-5 my-auto text-left relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                🔐 MFA Security Gate
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                Unlocking: {sectionTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Reassurance Banner */}
        <div className="flex items-start space-x-3 rounded-2xl border border-amber-800/40 bg-amber-950/30 p-4">
          <Smartphone className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            This section is protected by Multi-Factor Authentication. Enter the 6-digit TOTP code from your <strong>Microsoft Authenticator</strong> app to grant access.
          </p>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>6-Digit Passcode</span>
              <span className="text-[11px] text-slate-500 font-normal">Demo code: <code className="font-mono text-amber-300">123456</code></span>
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={otpInput}
              autoFocus
              onChange={(e) => {
                setOtpInput(e.target.value);
                setMfaError(false);
              }}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-amber-300 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {mfaError && (
            <div className="flex items-center space-x-2 rounded-xl border border-red-800/80 bg-red-950/60 p-3 text-xs font-semibold text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>Access Denied: Incorrect TOTP passcode. Please check your Microsoft Authenticator app.</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !otpInput}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Verify & Unlock</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
