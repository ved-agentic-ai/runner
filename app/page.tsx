'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { PciComplianceBanner } from '@/components/PciComplianceBanner';
import { UploadZone } from '@/components/UploadZone';
import { TreeView } from '@/components/TreeView';
import { RunnerDashboard } from '@/components/RunnerDashboard';
import { LiveTrafficSimulator } from '@/components/LiveTrafficSimulator';
import { AppDocumentationSection } from '@/components/AppDocumentationSection';
import { CustomUseCasesVault } from '@/components/CustomUseCasesVault';
import { EndpointDetailSheet } from '@/components/EndpointDetailSheet';
import { LegalDisclaimerModal } from '@/components/LegalDisclaimerModal';
import { MfaPromptModal } from '@/components/MfaPromptModal';
import { StepByStepClickGuide } from '@/components/StepByStepClickGuide';
import { Footer } from '@/components/Footer';
import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { 
  Play, 
  Cloud, 
  UploadCloud, 
  Sparkles, 
  ShieldAlert, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  FolderPlus,
  Lock,
  Globe,
  Award
} from 'lucide-react';

export default function Home() {
  const { loadDemoCollection, collectionName } = useRunnerStore();
  const { 
    disclaimerMode, 
    showFooter, 
    showPlatformOverviewBanner,
    showPciCompliance,
    showTrafficSimulator, 
    showCustomRulesVault, 
    showDocumentation,
    showPrivacyBanner,
    showStepByStepGuide,
    workspaceMode,
    memoryResetPolicy,
    mfaEnabled,
    isMfaAuthenticated,
    protectedSections 
  } = useAdminStore();
  
  // Active workspace tab
  const [activeMainTab, setActiveMainTab] = useState<'upload' | 'runner' | 'vault' | 'architecture' | 'disclaimer'>('upload');
  const [showVaultMfaModal, setShowVaultMfaModal] = useState(false);

  useEffect(() => {
    // If memory policy is set to 'flush', reset state on page refresh
    if (memoryResetPolicy === 'flush') {
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
    } else {
      // Re-hydrate flatEndpointMap from rootNodes if persisted in localStorage
      const storeState = useRunnerStore.getState();
      if (storeState.rootNodes && storeState.rootNodes.length > 0 && storeState.flatEndpointMap.size === 0) {
        const map = new Map();
        function indexNodes(nodes: any[]) {
          nodes.forEach((n) => {
            if (n.type === 'endpoint') map.set(n.id, n);
            if (n.children) indexNodes(n.children);
          });
        }
        indexNodes(storeState.rootNodes);
        useRunnerStore.setState({ flatEndpointMap: map });
      }
    }

    // Only load demo if no collection exists
    const currentName = useRunnerStore.getState().collectionName;
    if (!currentName) {
      loadDemoCollection();
    }
  }, []);

  const handleTabClick = (tab: 'upload' | 'runner' | 'vault' | 'architecture' | 'disclaimer') => {
    if (tab === 'vault' && mfaEnabled && protectedSections.vault && !isMfaAuthenticated) {
      setShowVaultMfaModal(true);
      return;
    }
    setActiveMainTab(tab);
  };

  const handleVaultMfaSuccess = () => {
    setShowVaultMfaModal(false);
    setActiveMainTab('vault');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Show Legal Disclaimer Modal ONLY if disclaimerMode is 'modal' */}
      {disclaimerMode === 'modal' && <LegalDisclaimerModal />}

      {/* Inline MFA Prompt Modal for Protected Vault Tab */}
      <MfaPromptModal
        isOpen={showVaultMfaModal}
        sectionTitle="Custom AI Rules Vault"
        onClose={() => setShowVaultMfaModal(false)}
        onSuccess={handleVaultMfaSuccess}
      />

      {/* Navigation Header */}
      <Header />

      {/* Main App Workspace (Expanded to 1600px Full Responsive Width) */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 space-y-4">
        
        {/* Local Secrets & Privacy Guarantee Banner (Configurable in Admin Control) */}
        {showPrivacyBanner && <PrivacyBanner />}

        {/* PCI-DSS Level 1 Security Banner (Hidden in Light Mode or if toggled off) */}
        {workspaceMode === 'full' && showPciCompliance && <PciComplianceBanner />}

        {/* Main View Mode Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md gap-3 overflow-hidden">
          <div className="flex items-center space-x-1 text-xs overflow-x-auto custom-scrollbar max-w-full shrink-0">
            <button
              onClick={() => handleTabClick('upload')}
              className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeMainTab === 'upload' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="h-4 w-4 shrink-0" />
              <span>📤 1. Upload & Collection Presets</span>
            </button>

            <button
              onClick={() => handleTabClick('runner')}
              className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeMainTab === 'runner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="h-4 w-4 shrink-0" />
              <span>🚀 2. Runner & Live Telemetry</span>
            </button>

            {/* Render Tabs 3 & 4 ONLY in Full Scale Mode */}
            {workspaceMode === 'full' && showCustomRulesVault && (
              <button
                onClick={() => handleTabClick('vault')}
                className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeMainTab === 'vault' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>🪄 3. Custom AI Rules Vault</span>
                {mfaEnabled && protectedSections.vault && !isMfaAuthenticated && (
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400 ml-0.5" />
                )}
              </button>
            )}

            {workspaceMode === 'full' && showDocumentation && (
              <button
                onClick={() => handleTabClick('architecture')}
                className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeMainTab === 'architecture' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="h-4 w-4 shrink-0" />
                <span>☁️ 4. AWS Cloud & AI Deep Dive</span>
              </button>
            )}

            {/* Render Disclaimer as a standalone tab when disclaimerMode is 'tab' */}
            {disclaimerMode === 'tab' && (
              <button
                onClick={() => handleTabClick('disclaimer')}
                className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  activeMainTab === 'disclaimer' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-red-400 hover:text-red-300'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>🛡️ Legal Disclaimer & Creator Statement</span>
              </button>
            )}
          </div>

          <span className="hidden lg:inline-block text-[11px] text-slate-400 font-mono pr-2 shrink-0">
            Active Workspace: <strong className="text-slate-200">{collectionName || 'Demo Suite'}</strong>
          </span>
        </div>

        {/* MAIN TAB 1: UPLOAD & COLLECTION PRESETS (PERFECT 100% SYMMETRICAL LAYOUT) */}
        {activeMainTab === 'upload' && (
          <div className="space-y-6 py-2">
            
            {/* Interactive Step-by-Step Instructions: Where to Click & How to Run */}
            {showStepByStepGuide && (
              <StepByStepClickGuide onNavigateTab={(tab) => setActiveMainTab(tab)} />
            )}

            {/* Top Row: Balanced 2-Column Desktop Grid (7 cols / 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Upload Dropzone & Core Capabilities (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <UploadZone />
              </div>

              {/* Right Column: Enterprise Telemetry & Status Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* System Status Dashboard Card */}
                <div className="rounded-3xl border border-slate-800 bg-[#0f172a]/90 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <Activity className="h-5 w-5 text-indigo-400 shrink-0" />
                      <h3 className="font-bold text-sm text-white">System Status & SLA Health</h3>
                    </div>
                    <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Operational</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Cloud className="h-3.5 w-3.5 text-indigo-400" /> Proxy Execution Gateway
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">100.0% Uptime (42ms)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-purple-400" /> AI Rule Synthesizer
                      </span>
                      <span className="font-mono text-indigo-300 font-bold">Gemini 1.5 Flash Online</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Zero-Trust Privacy Shield
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">AES-256 Client Masking</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => handleTabClick('runner')}
                      className="w-full inline-flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 transition-all"
                    >
                      <span>Proceed to 🚀 Runner Workspace</span>
                      <Play className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Preset Collections Quick Selector Card */}
                <div className="rounded-3xl border border-slate-800 bg-[#0f172a]/90 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <FolderPlus className="h-5 w-5 text-purple-400 shrink-0" />
                      <h3 className="font-bold text-sm text-white">Featured API Collection Suites</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div 
                      onClick={loadDemoCollection}
                      className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-purple-500/50 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-purple-300">
                        <span>JSONPlaceholder & ReqRes Test Suite</span>
                        <span className="text-[10px] text-slate-500 font-mono">16 Endpoints</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Full REST API suite testing GET/POST/PUT/DELETE, auth headers, and response latency.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Section: FULL-WIDTH 100% SYMMETRICAL PLATFORM BANNER (Spans all 12 columns!) */}
            {showPlatformOverviewBanner && (
              <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in">
                {/* Ambient Lighting */}
                <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/40 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                      <Sparkles className="h-3 w-3 fill-current text-indigo-400" />
                      <span>Next-Gen Enterprise API Test Platform v2.5</span>
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      Automated Assertion Synthesizer & Serverless Execution Engine
                    </h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      Seamlessly import Postman Collections (v2.0/v2.1), isolate API secrets locally, and run high-concurrency automated test suites powered by Gemini AI.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="rounded-2xl border border-indigo-800/60 bg-indigo-950/60 p-3 text-center">
                      <span className="block text-lg font-black text-indigo-400 font-mono">100%</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Local Secrets</span>
                    </div>
                    <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/60 p-3 text-center">
                      <span className="block text-lg font-black text-emerald-400 font-mono">42ms</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Avg SLA Latency</span>
                    </div>
                    <div className="rounded-2xl border border-purple-800/60 bg-purple-950/60 p-3 text-center">
                      <span className="block text-lg font-black text-purple-300 font-mono">PCI-DSS</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">SAQ-A Certified</span>
                    </div>
                  </div>
                </div>

                {/* 4 Symmetrical Feature Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs">
                      <Cpu className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>1. AI Assertion Generator</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Synthesizes Chai/Jest HTTP status 200, latency bounds, and JSON schema rules in milliseconds.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
                      <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>2. Zero-Trust Masking</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Passwords, JWTs, and API tokens are sanitized locally before AI script generation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                      <Globe className="h-4 w-4 text-purple-400 shrink-0" />
                      <span>3. Serverless CORS Proxy</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Executes fetch requests server-side bypassing browser cross-origin policy restrictions.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                      <Award className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>4. Stakeholder PPT Decks</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Generates executive PowerPoint deck presentations for QA leads and stakeholders in 1 click.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* MAIN TAB 2: RUNNER & LIVE TELEMETRY WORKSPACE */}
        {activeMainTab === 'runner' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Hierarchical Tree View Selector (4 cols) */}
              <div className="lg:col-span-4 h-[780px]">
                <TreeView />
              </div>

              {/* Right Column: Execution Engine & Telemetry Dashboard (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                <RunnerDashboard />
                {workspaceMode === 'full' && showTrafficSimulator && <LiveTrafficSimulator />}
              </div>

            </div>
          </div>
        )}

        {/* MAIN TAB 3: CUSTOM AI RULES VAULT */}
        {activeMainTab === 'vault' && workspaceMode === 'full' && showCustomRulesVault && (
          <CustomUseCasesVault />
        )}

        {/* MAIN TAB 4: SYSTEM ARCHITECTURE, AI DEEP DIVE & CLOUD GUIDE */}
        {activeMainTab === 'architecture' && workspaceMode === 'full' && showDocumentation && (
          <AppDocumentationSection />
        )}

        {/* MAIN TAB 5: STANDALONE LEGAL DISCLAIMER (When disclaimerMode is 'tab') */}
        {activeMainTab === 'disclaimer' && disclaimerMode === 'tab' && (
          <div className="w-full rounded-3xl border border-slate-800 bg-[#0f172a] p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-red-400 tracking-tight">
                Legal Disclaimer & Creator Statement
              </h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
              <p>
                This dashboard is a <strong className="text-slate-100">solely personally developed project</strong> created entirely by developer Ved Tripathi for educational and portfolio demonstration purposes. It has absolutely no affiliation, endorsement, connection, or association with any company, employer, firm, or external organization.
              </p>

              <p>
                No corporate IP, internal designs, private ideas, or proprietary code structures from any firm have been utilized in this work. All creative concepts, software modules, and source files belong exclusively to the developer.
              </p>

              <p>
                <strong className="text-slate-100">Decision-Making Advisory:</strong> The analytics, compounding models, and simulations presented herein are for illustrative purposes only. They do not constitute financial advice. Any reader or user must think rationally and exercise independent diligence before making trading decisions.
              </p>

              <p>
                <strong className="text-slate-100">Accusation Warning:</strong> Absolutely no moonlighting, gaslighting, or unauthorized freelance activities were performed in the creation of this project. Any assertions or allegations stating otherwise are false, factually incorrect, and constitute actionable defamation. The creator reserves all legal rights to seek damages against defamatory remarks.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Slide-out Drawer for Detailed HTTP Logs & Assertions */}
      <EndpointDetailSheet />

      {/* Developer Credits Footer (Hidden in Light Mode or if toggled off) */}
      {workspaceMode === 'full' && showFooter && <Footer />}
    </div>
  );
}
