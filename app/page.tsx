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
import { Footer } from '@/components/Footer';
import { useRunnerStore } from '@/lib/store';
import { Play, Cloud, UploadCloud, Sparkles } from 'lucide-react';

export default function Home() {
  const { loadDemoCollection, collectionName } = useRunnerStore();
  
  // Set UPLOAD as default 1st active workspace tab
  const [activeMainTab, setActiveMainTab] = useState<'upload' | 'runner' | 'vault' | 'architecture'>('upload');

  useEffect(() => {
    if (!collectionName) {
      loadDemoCollection();
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Legal Disclaimer Modal on Every Page Load */}
      <LegalDisclaimerModal />

      {/* Navigation Header */}
      <Header />

      {/* Main App Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 space-y-4">
        
        {/* Local Secrets & Privacy Guarantee Banner */}
        <PrivacyBanner />

        {/* Main View Mode Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md gap-3 overflow-hidden">
          <div className="flex items-center space-x-1 text-xs overflow-x-auto custom-scrollbar max-w-full shrink-0">
            {[
              { id: 'upload', label: '📤 1. Upload & Collection Presets', icon: UploadCloud },
              { id: 'runner', label: '🚀 2. Runner & Live Telemetry', icon: Play },
              { id: 'vault', label: '🪄 3. Custom AI Rules Vault (Edit Rules)', icon: Sparkles },
              { id: 'architecture', label: '☁️ 4. AWS Cloud, AI Deep Dive & Deck Guide', icon: Cloud },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                    activeMainTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
                onClick={() => setActiveMainTab('runner')}
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
                <LiveTrafficSimulator />
              </div>

            </div>
          </div>
        )}

        {/* MAIN TAB 3: CUSTOM AI RULES VAULT */}
        {activeMainTab === 'vault' && (
          <CustomUseCasesVault />
        )}

        {/* MAIN TAB 4: SYSTEM ARCHITECTURE, AI DEEP DIVE, NAPKIN/GAMMA PROMPTS & PPT DECK */}
        {activeMainTab === 'architecture' && (
          <AppDocumentationSection />
        )}

      </main>

      {/* Slide-out Drawer for Detailed HTTP Logs & Assertions */}
      <EndpointDetailSheet />

      {/* Developer Credits Footer */}
      <Footer />
    </div>
  );
}
