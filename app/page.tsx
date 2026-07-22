'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { UploadZone } from '@/components/UploadZone';
import { TreeView } from '@/components/TreeView';
import { RunnerDashboard } from '@/components/RunnerDashboard';
import { LiveTrafficSimulator } from '@/components/LiveTrafficSimulator';
import { AppDocumentationSection } from '@/components/AppDocumentationSection';
import { EndpointDetailSheet } from '@/components/EndpointDetailSheet';
import { useRunnerStore } from '@/lib/store';
import { Play, Cloud, UploadCloud } from 'lucide-react';

export default function Home() {
  const { loadDemoCollection, collectionName } = useRunnerStore();
  const [activeMainTab, setActiveMainTab] = useState<'runner' | 'architecture' | 'upload'>('runner');

  useEffect(() => {
    if (!collectionName) {
      loadDemoCollection();
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Header />

      {/* Main App Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 space-y-4">
        
        {/* Local Secrets & Privacy Guarantee Banner */}
        <PrivacyBanner />

        {/* Main View Mode Selector Bar */}
        <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center space-x-1 text-xs">
            {[
              { id: 'runner', label: '🚀 Runner & Live Telemetry', icon: Play },
              { id: 'upload', label: '📤 Upload & Presets', icon: UploadCloud },
              { id: 'architecture', label: '☁️ AWS Cloud & System Architecture', icon: Cloud },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeMainTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono pr-2">
            Active Workspace: <strong className="text-slate-200">{collectionName || 'Demo Suite'}</strong>
          </span>
        </div>

        {/* MAIN TAB 1: RUNNER & LIVE TELEMETRY WORKSPACE */}
        {activeMainTab === 'runner' && (
          <div className="space-y-5">
            {/* Split Grid: Tree Selector & Live Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Hierarchical Tree View Selector (4 cols) */}
              <div className="lg:col-span-4 h-[740px]">
                <TreeView />
              </div>

              {/* Right Column: Execution Engine & Telemetry Dashboard (8 cols) */}
              <div className="lg:col-span-8 space-y-5">
                <RunnerDashboard />
                {/* Live Traffic Simulator immediately visible right here! */}
                <LiveTrafficSimulator />
              </div>

            </div>
          </div>
        )}

        {/* MAIN TAB 2: UPLOAD & PRESETS */}
        {activeMainTab === 'upload' && (
          <div className="max-w-4xl mx-auto py-4">
            <UploadZone />
          </div>
        )}

        {/* MAIN TAB 3: SYSTEM ARCHITECTURE & AWS CLOUD GUIDE */}
        {activeMainTab === 'architecture' && (
          <AppDocumentationSection />
        )}

      </main>

      {/* Slide-out Drawer for Detailed HTTP Logs & Assertions */}
      <EndpointDetailSheet />
    </div>
  );
}
