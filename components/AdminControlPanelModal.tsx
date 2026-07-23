'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  AlertTriangle, 
  QrCode, 
  Copy, 
  Check, 
  RefreshCw, 
  LogOut, 
  DollarSign, 
  CreditCard, 
  Building2, 
  Layout, 
  Sliders, 
  Sparkles,
  Loader2,
  Crown,
  ToggleLeft,
  ToggleRight,
  Award,
  Layers,
  Key
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { generateMfaSetup, generateBase32Secret } from '@/lib/totp-utils';
import { getQuotaState, resetDemoQuota } from '@/lib/quota-tracker';

export const AdminControlPanelModal: React.FC = () => {
  const {
    workspaceMode,
    setWorkspaceMode,
    disclaimerMode,
    setDisclaimerMode,
    showFooter,
    showPlatformOverviewBanner,
    showCapabilitiesGrid,
    showTrafficSimulator,
    showCustomRulesVault,
    showDocumentation,
    showHeaderControls,
    showSaaSUpgrades,
    showPciCompliance,
    showPrivacyBanner,
    showQuotaTelemetry,
    showPresetButton,
    showAiKeyButton,
    toggleSectionVisibility,
    memoryResetPolicy,
    setMemoryResetPolicy,
    mfaEnabled,
    mfaSecret,
    isMfaAuthenticated,
    verifyMfaToken,
    lockAdminPanel,
    protectedSections,
    toggleSectionProtection,
    monetizationEnabled,
    updateMonetization,
    resetAllSettings
  } = useAdminStore();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'security' | 'layout' | 'memory' | 'monetization'>('security');
  
  // OTP Verification Form State
  const [otpInput, setOtpInput] = useState('');
  const [mfaError, setMfaError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // QR Code pairing sub-modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleGenerateNewSecret = async () => {
    const newSecret = generateBase32Secret();
    setSecretKey(newSecret);
    
    // Save to Zustand admin store
    useAdminStore.getState().setMfaSecret(newSecret);

    const setupData = await generateMfaSetup(newSecret);
    setQrCodeUrl(setupData.qrCodeDataUrl);
    setShowQrModal(true);
  };

  const handleShowCurrentQr = async () => {
    const secret = mfaSecret || 'GOD3PU4Z4UWCLZFHVJ6FERNYCZ6UTVZK';
    setSecretKey(secret);
    const setupData = await generateMfaSetup(secret);
    setQrCodeUrl(setupData.qrCodeDataUrl);
    setShowQrModal(true);
  };

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 1500);
  };

  const handleFlushNow = () => {
    if (confirm('Are you sure you want to flush all in-memory workspace data and reset store state?')) {
      useAdminStore.getState().resetAllSettings();
      window.location.reload();
    }
  };

  const handleLockAndClose = () => {
    lockAdminPanel();
    setIsOpen(false);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-amber-500/30 bg-[#0f172a] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto text-left relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Owner & Admin Protection Panel
              </h2>
              <p className="text-xs text-slate-400">
                Configure application layout, section security, data retention policy, and web monetization.
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
                { id: 'layout', label: '⚙️ 2. Granular Widget Toggles', icon: Layout },
                { id: 'memory', label: '🧹 3. Memory & Flush Policy', icon: RefreshCw },
                { id: 'monetization', label: '💵 4. Monetization & SaaS Tiers', icon: DollarSign },
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
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-400" /> Multi-Factor Authentication (MFA / TOTP)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Pair your mobile phone with Microsoft Authenticator, Google Authenticator, or Authy.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleShowCurrentQr}
                      className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Show Paired Device QR Code</span>
                    </button>

                    <button
                      onClick={handleGenerateNewSecret}
                      className="inline-flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      <RefreshCw className="h-4 w-4 text-purple-400" />
                      <span>Generate New MFA Secret Key</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" /> Granular Protected Application Sections
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Select which application features require MFA passcode authentication before users can open them.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'admin', label: 'Admin Control Panel', desc: 'Protects layout, memory policy, and monetization settings.' },
                      { key: 'environment', label: 'Environment Variables Manager', desc: 'Requires MFA passcode to view or edit API secret keys.' },
                      { key: 'vault', label: 'Custom AI Rules Vault', desc: 'Requires MFA passcode to view or create custom assertion rules.' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 hover:bg-slate-900 cursor-pointer">
                        <div>
                          <span className="font-semibold text-slate-200 block text-xs">{item.label}</span>
                          <span className="text-slate-400 text-[11px]">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={!!protectedSections[item.key]}
                          onChange={() => toggleSectionProtection(item.key)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GRANULAR WIDGET & SECTION VISIBILITY TOGGLES */}
            {activeTab === 'layout' && (
              <div className="space-y-5 text-xs text-slate-300">
                
                {/* Workspace Presentation Mode Selector */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-400" /> App Presentation Mode (Full Enterprise vs Light Team View)
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Select between Full Scale Enterprise Mode (all deep-dive features) or Light Team Mode (clean presentation view for team members).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setWorkspaceMode('full')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        workspaceMode === 'full'
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-indigo-300 block mb-1">
                        🌟 Option A: Full Scale Enterprise App
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Unlocks all 4 workspace tabs, live traffic simulator, custom AI rules vault, AWS system architecture, and monetization suites.
                      </p>
                    </div>

                    <div
                      onClick={() => setWorkspaceMode('light')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        workspaceMode === 'light'
                          ? 'border-purple-500 bg-purple-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-purple-300 block mb-1">
                        ⚡ Option B: Light Team Demo Mode
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Hides internal enterprise architecture, AWS deep dives, and vault to display a clean, high-speed API runner for team showcases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Legal Disclaimer Display Mode */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Layout className="h-4 w-4 text-indigo-400" /> Legal Disclaimer Display Mode
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setDisclaimerMode('modal')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        disclaimerMode === 'modal'
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-indigo-300 block mb-1">
                        Option 1: Page-Load Dialog Modal
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Presents an un-dismissable high-priority disclaimer popup backdrop immediately on page load.
                      </p>
                    </div>

                    <div
                      onClick={() => setDisclaimerMode('tab')}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                        disclaimerMode === 'tab'
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-sm text-indigo-300 block mb-1">
                        Option 2: Standalone Tab Bar Section
                      </span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Removes startup popup dialog and embeds disclaimer as Tab #5 in top workspace bar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 100% Complete Widget Controls Grid */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-purple-400" /> Complete Page Widget & Section Visibility Toggles
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Independently show or hide any button, widget, banner, or section on the page.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'showSaaSUpgrades', label: '👑 "Upgrade to Pro" SaaS Pricing Button' },
                      { key: 'showCapabilitiesGrid', label: '⚡ 4-Column Core Capabilities Grid' },
                      { key: 'showPlatformOverviewBanner', label: '✨ Creative Platform Architecture Banner' },
                      { key: 'showPrivacyBanner', label: '🔒 "100% Local Privacy & Secrets" Banner' },
                      { key: 'showPciCompliance', label: '🛡️ "PCI-DSS Level 1 Security" Banner' },
                      { key: 'showQuotaTelemetry', label: '📊 App Demo Key / Token Usage Monitor' },
                      { key: 'showPresetButton', label: '📁 "Load Demo API Presets" Button' },
                      { key: 'showAiKeyButton', label: '🔑 "Configure AI API Key" Button' },
                      { key: 'showTrafficSimulator', label: '📈 Live Traffic Simulator Widget' },
                      { key: 'showCustomRulesVault', label: '🪄 Custom AI Rules Vault (Tab 3)' },
                      { key: 'showDocumentation', label: '☁️ AWS System Architecture (Tab 4)' },
                      { key: 'showFooter', label: '📝 Footer Developer Credits & Copyright Panel' },
                    ].map((item) => {
                      const isVisible = !!(useAdminStore.getState() as any)[item.key];
                      return (
                        <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 hover:bg-slate-900">
                          <span className="font-semibold text-slate-200 text-xs">{item.label}</span>
                          <button
                            onClick={() => toggleSectionVisibility(item.key as any)}
                            className={`p-1 text-xs font-bold transition-all ${isVisible ? 'text-emerald-400' : 'text-slate-500'}`}
                          >
                            {isVisible ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: MEMORY & FLUSH POLICY */}
            {activeTab === 'memory' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-emerald-400" /> Data Retention & Memory Policy
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Configure how uploaded Postman collections and environment variables behave across page refreshes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Owner API Quota & 5-Hour Cooldown Override Card */}
                <div className="rounded-2xl border border-amber-800/60 bg-amber-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-amber-400" /> Owner API Quota & 5-Hour Cooldown Override
                    </span>
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono text-amber-200 border border-amber-500/40 font-extrabold">
                      MFA Admin Authorized
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Public users are restricted to 3 demo API calls with an automatic <strong>5-hour cooldown timer</strong> to protect platform infrastructure from cost overruns. As the MFA-authenticated owner, you can manually reset the 5-hour cooldown timer at any time below.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3 border-t border-amber-900/40">
                    <span className="font-mono text-xs text-amber-200">
                      Status: {getQuotaState().rateLimitStatus === 'quota_exceeded' ? `🔒 Locked (5h Cooldown - ${getQuotaState().cooldownFormatted || 'Active'})` : '✅ Operational (0/3 Calls Used)'}
                    </span>
                    <button
                      onClick={() => {
                        resetDemoQuota();
                        alert('App Demo Key Quota & 5-Hour Cooldown reset successfully!');
                      }}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-500 transition-all shrink-0"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Reset Demo Quota & Cooldown Now</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MONETIZATION, BILLING, SAAS TIERS & PCI COMPLIANCE */}
            {activeTab === 'monetization' && (
              <div className="space-y-5 text-xs text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-400" /> Merchant Gateways & PCI SAQ A Compliance
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4" /> 1. Stripe Gateway
                        </span>
                        <span className="rounded bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 border border-emerald-800">
                          Level 1 PCI
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Stripe handles 100% of card processing via SAQ A tokens. Zero cardholder data touches your server.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" /> 2. PayPal Express
                        </span>
                        <span className="rounded bg-blue-950 text-blue-400 text-[10px] px-2 py-0.5 border border-blue-800">
                          Certified
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        PayPal processes international express payments directly on PayPal's secure encrypted checkout vault.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" /> 3. Google AdSense
                        </span>
                        <span className="rounded bg-amber-950 text-amber-400 text-[10px] px-2 py-0.5 border border-amber-800">
                          EFT Payout
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Monetize site traffic via display banners with monthly EFT payouts directly to your bank account.
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
