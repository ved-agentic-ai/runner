'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Lock, 
  Layout, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle,
  Smartphone,
  CreditCard,
  Building2,
  ToggleLeft,
  ToggleRight,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  Loader2
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { useRunnerStore } from '@/lib/store';
import { generateMfaSetup } from '@/lib/totp-utils';

export const AdminControlPanelModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'security' | 'layout' | 'memory' | 'monetization'>('security');
  const [otpInput, setOtpInput] = useState('');
  const [mfaError, setMfaError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Live QR Code Setup State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const {
    disclaimerMode,
    setDisclaimerMode,
    toggleSectionVisibility,
    memoryResetPolicy,
    setMemoryResetPolicy,
    mfaEnabled,
    setMfaEnabled,
    mfaSecret,
    setMfaSecret,
    isMfaAuthenticated,
    verifyMfaToken,
    lockAdminPanel,
    protectedSections,
    toggleSectionProtection
  } = useAdminStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateNewMfa = async (useExistingSecret = false) => {
    try {
      const secretToUse = useExistingSecret && mfaSecret ? mfaSecret : undefined;
      const setupData = await generateMfaSetup(secretToUse, 'vedtripathi@gmail.com');
      
      setQrCodeUrl(setupData.qrCodeDataUrl);
      setSecretKey(setupData.secret);
      setMfaSecret(setupData.secret); // Update store secret immediately
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed to generate MFA QR code:', err);
    }
  };

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
    }
  };

  const handleLockAndClose = () => {
    lockAdminPanel();
    setIsOpen(false);
    setOtpInput('');
  };

  const handleFlushNow = () => {
    useRunnerStore.setState({
      executionResults: {},
      selectedNodeIds: [],
      envVariables: {},
      runSummary: {
        total: 0,
        passed: 0,
        failed: 0,
        pending: 0,
        running: 0,
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        status: 'idle'
      }
    });
    alert('App state and memory flushed successfully! All local cached endpoints and environment variables have been reset.');
  };

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl flex flex-col space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <ShieldCheck className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                🔐 Owner & Admin Control Center
              </h2>
              <p className="text-xs text-slate-400">
                Exclusive site owner configuration panel for MFA security, dynamic layout toggles, memory reset rules, and monetization payouts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isMfaAuthenticated && (
              <button
                onClick={handleLockAndClose}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-red-800 bg-red-950/60 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900 transition-all"
                title="Lock Admin Panel & Sign Out MFA Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Lock Panel</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MFA Verification Gate */}
        {mfaEnabled && !isMfaAuthenticated ? (
          <div className="rounded-2xl border border-amber-800/60 bg-amber-950/30 p-6 space-y-5">
            <div className="flex items-center space-x-3 border-b border-amber-800/40 pb-3">
              <Smartphone className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-amber-300">
                  MFA Authentication Required (Microsoft / Google Authenticator)
                </h3>
                <p className="text-xs text-slate-300">
                  Enter your 6-digit TOTP verification code sent to your Mobile Authenticator app to access Admin controls.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP from phone"
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value);
                  setMfaError(false);
                }}
                className="w-full sm:w-64 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-center font-mono text-base font-bold tracking-widest text-amber-300 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-orange-500 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Passcode & Unlock</span>
                )}
              </button>
            </form>

            {mfaError && (
              <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5 bg-red-950/60 p-2.5 rounded-xl border border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>Access Denied: Incorrect TOTP passcode. Please check the 6-digit code shown in your Microsoft Authenticator app (or use demo code 123456).</span>
              </p>
            )}

            <div className="pt-2 border-t border-amber-900/40 text-[11px] text-slate-400 flex items-center justify-between">
              <span>🔒 Pair/Scan QR is locked until valid authentication.</span>
              <span className="font-mono text-slate-500">Secret Hash: {mfaSecret.slice(0, 4)}****</span>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 rounded-2xl bg-slate-950 p-1.5 border border-slate-800 overflow-x-auto custom-scrollbar">
              {[
                { id: 'security', label: '🔐 1. Security & MFA Protection', icon: Lock },
                { id: 'layout', label: '⚙️ 2. Dynamic Layout & Toggles', icon: Layout },
                { id: 'memory', label: '🧹 3. Memory & Flush Policy', icon: RefreshCw },
                { id: 'monetization', label: '💵 4. Monetization & Bank Payout', icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: SECURITY & MFA PROTECTION */}
            {activeTab === 'security' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-400" /> MFA Protection Toggle
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Require Mobile TOTP Authenticator code before granting access to Admin & Protected Sections.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGenerateNewMfa(true)}
                        className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-800 bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-all"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Show Paired Device QR Code</span>
                      </button>

                      <button
                        onClick={() => setMfaEnabled(!mfaEnabled)}
                        className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          mfaEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mfaEnabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-slate-500" />}
                        <span>{mfaEnabled ? 'MFA Protection ENABLED' : 'MFA Protection DISABLED'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs text-slate-200">Select Sections Requiring MFA Protection:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { key: 'admin', title: 'Admin Control Center', desc: 'Locks this Admin panel behind MFA.' },
                        { key: 'vault', title: 'Custom AI Rules Vault', desc: 'Requires MFA before editing custom rules.' },
                        { key: 'environment', title: 'Environment Variables Manager', desc: 'Requires MFA before viewing secret keys.' },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:bg-slate-900 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={!!protectedSections[item.key]}
                            onChange={() => toggleSectionProtection(item.key)}
                            className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-bold text-slate-200 text-xs block">{item.title}</span>
                            <span className="text-[11px] text-slate-400">{item.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DYNAMIC LAYOUT & SECTION TOGGLES */}
            {activeTab === 'layout' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Layout className="h-4 w-4 text-indigo-400" /> Legal Disclaimer Display Location
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Choose whether the Legal Disclaimer appears as an interactive popup dialog on page load or as a standalone tab section.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setDisclaimerMode('modal')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          disclaimerMode === 'modal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Dialog on Page Load
                      </button>
                      <button
                        onClick={() => setDisclaimerMode('tab')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          disclaimerMode === 'tab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Embedded Tab Section
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
                    Dynamic Section Visibility Toggles (Zero Layout Misalignment)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'showFooter', label: 'Developer Footer & Social Links', desc: 'Displays Ved Tripathi branding and GitHub link at bottom.' },
                      { key: 'showTrafficSimulator', label: 'Live Traffic & Routing Simulator', desc: 'Shows real-time HTTP routing animation stream.' },
                      { key: 'showCustomRulesVault', label: 'Custom AI Test Rules Vault Tab', desc: 'Displays Tab 3 in top workspace bar.' },
                      { key: 'showDocumentation', label: 'AWS Cloud Architecture & AI Deep Dive Tab', desc: 'Displays Tab 4 in top workspace bar.' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5"
                      >
                        <div>
                          <span className="font-bold text-slate-200 text-xs block">{item.label}</span>
                          <span className="text-[11px] text-slate-400">{item.desc}</span>
                        </div>
                        <button
                          onClick={() => toggleSectionVisibility(item.key as any)}
                          className={`rounded-lg px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                            (useAdminStore.getState() as any)[item.key]
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {(useAdminStore.getState() as any)[item.key] ? 'VISIBLE' : 'HIDDEN'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: MEMORY & RESET POLICY */}
            {activeTab === 'memory' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-purple-400" /> Application Memory Reset Policy
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Configure whether local application memory (environment variables, custom rules, execution logs) is retained across sessions or automatically flushed on page refresh.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setMemoryResetPolicy('retain')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        memoryResetPolicy === 'retain'
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-indigo-300 block mb-1">
                        Option A: Retain Memory (Default)
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Preserves environment variables, custom test rules, and run history in browser memory across page reloads.
                      </p>
                    </div>

                    <div
                      onClick={() => setMemoryResetPolicy('flush')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        memoryResetPolicy === 'flush'
                          ? 'border-amber-500 bg-amber-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-amber-300 block mb-1">
                        Option B: Automatic Flush on Load
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Flushes all memory, cached API endpoints, and environment variables on next page refresh for a clean app reset.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={handleFlushNow}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition-all"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Flush All Memory Right Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MONETIZATION & BANK PAYOUT SETUP */}
            {activeTab === 'monetization' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" /> Web Monetization & Direct Bank Payout Setup
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Configure payment processing and direct bank account payout integration for your live web application.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4" /> 1. Stripe Connect
                        </span>
                        <span className="rounded bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 border border-emerald-800">
                          Direct Bank Payout
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Accept credit card subscriptions (SaaS tier) and receive direct automatic daily payouts into your bank account.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" /> 2. PayPal Business
                        </span>
                        <span className="rounded bg-blue-950 text-blue-400 text-[10px] px-2 py-0.5 border border-blue-800">
                          Global Express
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Allow international users to pay via PayPal or debit cards with direct bank transfer integration.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" /> 3. Google AdSense
                        </span>
                        <span className="rounded bg-amber-950 text-amber-400 text-[10px] px-2 py-0.5 border border-amber-800">
                          Ad Revenue
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Monetize site traffic via display banners with monthly EFT payouts directly to your linked bank account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* QR Code Setup Sub-Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-indigo-800 bg-[#0f172a] p-6 shadow-2xl space-y-5 text-center my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-400" /> Mobile Authenticator Setup
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed text-left">
              Open <strong>Microsoft Authenticator</strong>, <strong>Google Authenticator</strong>, or <strong>Authy</strong> on your smartphone, tap <strong>+ Add Account</strong>, and scan the QR code below:
            </p>

            {/* QR Code Image */}
            {qrCodeUrl && (
              <div className="flex justify-center py-2">
                <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-indigo-500/30">
                  <img src={qrCodeUrl} alt="MFA QR Code" className="h-44 w-44" />
                </div>
              </div>
            )}

            {/* Secret Key Copy */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-left space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Secret Key (Manual Entry):</span>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs text-indigo-300 font-bold tracking-wider">{secretKey}</code>
                <button
                  onClick={copySecretToClipboard}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                >
                  {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              Done & Close QR Window
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-950 to-red-950 border border-amber-700/60 px-3 py-1.5 text-xs font-bold text-amber-300 hover:from-amber-900 hover:to-red-900 transition-all shadow-md whitespace-nowrap"
        title="Owner & Admin Control Panel (MFA Protected)"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>🔐 Admin Control</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
