'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { UploadZone } from '@/components/UploadZone';
import { TreeView } from '@/components/TreeView';
import { RunnerDashboard } from '@/components/RunnerDashboard';
import { LiveTrafficSimulator } from '@/components/LiveTrafficSimulator';
import { AppDocumentationSection } from '@/components/AppDocumentationSection';
import { CustomUseCasesVault } from '@/components/CustomUseCasesVault';
import { EndpointDetailSheet } from '@/components/EndpointDetailSheet';
import { LegalDisclaimerModal } from '@/components/LegalDisclaimerModal';
import { MfaPromptModal } from '@/components/MfaPromptModal';
import { Footer } from '@/components/Footer';
import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { Play, Cloud, UploadCloud, Sparkles, ShieldAlert } from 'lucide-react';

export default function Home() {
  const { loadDemoCollection, collectionName, rootNodes } = useRunnerStore();
  const { 
    disclaimerMode, 
    showFooter, 
    showTrafficSimulator, 
    showCustomRulesVault, 
    showDocumentation,
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
      const { flatEndpointMap, parsePostmanCollection } = require('@/lib/postman-parser');
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

      {/* Main App Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 space-y-4">
        
        {/* Local Secrets & Privacy Guarantee Banner */}
        <PrivacyBanner />

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

            {showCustomRulesVault && (
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

            {showDocumentation && (
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

        {/* MAIN TAB 1: UPLOAD & COLLECTION PRESETS */}
        {activeMainTab === 'upload' && (
          <div className="max-w-4xl mx-auto py-4 space-y-6">
            <UploadZone />
            <div className="flex justify-center">
              <button
                onClick={() => handleTabClick('runner')}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 transition-all"
              >
                <span>Proceed to 🚀 Runner Workspace</span>
                <Play className="h-4 w-4 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN TAB 2: RUNNER & LIVE TELEMETRY WORKSPACE */}
        {activeMainTab === 'runner' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Hierarchical Tree View Selector (4 cols) */}
              <div className="lg:col-span-4 h-[740px]">
                <TreeView />
              </div>

              {/* Right Column: Execution Engine & Telemetry Dashboard (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                <RunnerDashboard />
                {showTrafficSimulator && <LiveTrafficSimulator />}
              </div>

            </div>
          </div>
        )}

        {/* MAIN TAB 3: CUSTOM AI RULES VAULT */}
        {activeMainTab === 'vault' && showCustomRulesVault && (
          <CustomUseCasesVault />
        )}

        {/* MAIN TAB 4: SYSTEM ARCHITECTURE, AI DEEP DIVE & CLOUD GUIDE */}
        {activeMainTab === 'architecture' && showDocumentation && (
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

      {/* Developer Credits Footer (Conditionally toggled by Admin) */}
      {showFooter && <Footer />}
    </div>
  );
}
