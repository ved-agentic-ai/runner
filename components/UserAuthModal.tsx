'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, LogIn, UserPlus, LogOut, CheckCircle, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { useSubscriptionStore } from '@/lib/subscription-store';

export const UserAuthModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'profile'>('login');
  const [mounted, setMounted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated, login, signup, logout } = useUserAuthStore();
  const { plan } = useSubscriptionStore();

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      setActiveTab('profile');
    }
  }, [isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.message || 'Invalid email or password');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signup(name, email, password);
    setLoading(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  const modalContent = (
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
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl border border-red-800/80 bg-red-950/40 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900 transition-all"
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-2xl bg-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            ) : (
              /* SIGNUP FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Ved Tripathi"
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

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
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm whitespace-nowrap"
      >
        <User className="h-3.5 w-3.5 text-indigo-400" />
        <span>{isAuthenticated && user ? user.name : 'Sign In'}</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
