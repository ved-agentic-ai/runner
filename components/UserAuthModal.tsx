'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, LogIn, UserPlus, LogOut, CheckCircle, Lock, Mail, Shield, Sparkles, AlertTriangle, X } from 'lucide-react';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { useSubscriptionStore } from '@/lib/subscription-store';
import { useRunnerStore } from '@/lib/store';
import { ALL_WORLD_COUNTRIES } from '@/lib/countries-data';

export const UserAuthModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'profile'>('login');
  const [mounted, setMounted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+46');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [clearWorkspaceOnSignOut, setClearWorkspaceOnSignOut] = useState(true);
  const [showSignOutConfirmModal, setShowSignOutConfirmModal] = useState(false);

  const { user, isAuthenticated, login, logout } = useUserAuthStore();
  const { plan } = useSubscriptionStore();

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    setMounted(true);
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener('open-auth-modal', handleOpenModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenModal);
  }, []);

  const handleSendRealtimeOtp = async () => {
    if (!email && !phone) {
      setError('Please enter your email or mobile phone number to receive your OTP code');
      return;
    }
    setError(null);
    setOtpSending(true);

    try {
      const fullPhone = phone ? `${countryCode} ${phone}` : '';
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, email })
      });
      const data = await res.json();
      setOtpSending(false);

      if (data.success) {
        setResendTimer(30);
        const targetDesc = fullPhone ? `SMS (${fullPhone})` : `Email (${email})`;
        setOtpSentNotice(`🔑 Test OTP Code for ${targetDesc}: [ ${data.otp} ] (Valid for 5 mins)\nNote: Real-time SMS dispatch uses Twilio/Firebase SMS keys.`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setOtpSending(false);
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, otpCode })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        useUserAuthStore.getState().setUser(data.user);
        setIsOpen(false);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Registration failed');
    }
  };

  const handleExecuteSignOut = () => {
    if (clearWorkspaceOnSignOut) {
      useRunnerStore.setState({
        collectionName: '',
        rootNodes: [],
        flatEndpointMap: new Map(),
        envVariables: {},
        selectedNodeIds: [],
        executionResults: {}
      });
    }
    logout();
    setShowSignOutConfirmModal(false);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Header Trigger Button */}
      {isAuthenticated && user ? (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center space-x-2 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all shadow-md"
        >
          <User className="h-3.5 w-3.5 text-indigo-400" />
          <span className="truncate max-w-[130px]">{user.name}</span>
          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-200 border border-indigo-500/30 uppercase">
            {user.role}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all shadow-md"
        >
          <LogIn className="h-3.5 w-3.5 text-indigo-400" />
          <span>🔑 Sign In</span>
        </button>
      )}

      {/* Auth Modal Dialog Portal - ONLY RENDERED WHEN isOpen IS TRUE */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-indigo-500/30 bg-[#0f172a] p-6 shadow-2xl space-y-6 my-auto text-left relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {isAuthenticated ? 'Developer Account' : 'Sign In to Vkratim'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isAuthenticated ? 'Manage active plan & developer profile' : 'Access your saved API suites and Pro subscriptions'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* LOGGED IN USER PROFILE VIEW */}
            {isAuthenticated && user ? (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{user.name}</h3>
                      <p className="text-slate-400 text-xs">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] px-3 py-1 border border-indigo-500/40 font-bold uppercase tracking-wider">
                      {user.role === 'owner' ? 'Owner Admin' : `${plan.toUpperCase()} SUBSCRIBER`}
                    </span>
                  </div>

                  <div className="border-t border-indigo-900/40 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Active Membership:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> {plan === 'pro' ? 'SaaS Pro Unlimited' : 'Free Tier'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setShowSignOutConfirmModal(true)}
                    className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl border border-red-800/80 bg-red-950/40 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900 transition-all shadow-lg shadow-red-950/50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* UNAUTHENTICATED SIGN IN / SIGN UP TABS */
              <div className="space-y-4">
                
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => { setActiveTab('login'); setError(null); }}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      activeTab === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="h-3.5 w-3.5 inline mr-1.5" /> Sign In
                  </button>
                  <button
                    onClick={() => { setActiveTab('signup'); setError(null); }}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      activeTab === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5 inline mr-1.5" /> Create Account
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-800/80 bg-red-950/40 p-3 text-xs text-red-300 leading-snug">
                    ⚠️ {error}
                  </div>
                )}

                {/* LOGIN FORM */}
                {activeTab === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Developer Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-2xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Authenticating...' : 'Sign In to Account'}
                    </button>
                  </form>
                ) : (
                  /* CREATE ACCOUNT FORM */
                  <form onSubmit={handleSignupSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Developer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Developer Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone Number (Optional)</label>
                      <div className="flex space-x-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-40 shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-2 py-2.5 text-[11px] font-bold text-amber-300 focus:border-indigo-500 focus:outline-none font-mono truncate"
                        >
                          {ALL_WORLD_COUNTRIES.map((c, idx) => (
                            <option key={`${c.code}-${c.name}-${idx}`} value={c.code}>
                              {c.flag} {c.code} ({c.name})
                            </option>
                          ))}
                        </select>

                        <input
                          type="tel"
                          placeholder="70 123 4567 (Optional)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* REAL-TIME OTP SECTION */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300">OTP Code Verification</label>
                        <button
                          type="button"
                          onClick={handleSendRealtimeOtp}
                          disabled={otpSending || resendTimer > 0 || (!email && !phone)}
                          className="rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all disabled:opacity-50 font-mono"
                        >
                          {otpSending ? 'Sending...' : resendTimer > 0 ? `⏱ Resend in ${resendTimer}s` : '📩 Request OTP Code'}
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP Code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-amber-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono font-bold tracking-widest text-center"
                      />
                    </div>

                    {otpSentNotice && (
                      <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3 text-xs text-emerald-300 leading-snug font-mono font-bold animate-in fade-in">
                        {otpSentNotice}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-2xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creating Account...' : 'Create Free Developer Account'}
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>

          {/* DEDICATED SIGN OUT CONFIRMATION MODAL */}
          {showSignOutConfirmModal && (
            <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-sm rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Confirm Account Sign Out</h3>
                    <p className="text-xs text-slate-400">Security & Workspace Memory Policy</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Are you sure you want to sign out of your account?
                </p>

                <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-3.5 space-y-2 text-left">
                  <span className="font-bold text-amber-300 text-xs block">🛡️ Workspace Memory Security</span>
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearWorkspaceOnSignOut}
                      onChange={(e) => setClearWorkspaceOnSignOut(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-200 leading-snug font-medium">
                      🧹 Reset & Clear active collection endpoints from screen memory upon signing out
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => setShowSignOutConfirmModal(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteSignOut}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all"
                  >
                    Confirm Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>,
        document.body
      )}
    </>
  );
};
