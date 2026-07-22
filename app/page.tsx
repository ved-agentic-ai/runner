'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { UploadZone } from '@/components/UploadZone';
import { TreeView } from '@/components/TreeView';
import { RunnerDashboard } from '@/components/RunnerDashboard';
import { LiveTrafficSimulator } from '@/components/LiveTrafficSimulator';
import { AppDocumentationSection } from '@/components/AppDocumentationSection';
import { EndpointDetailSheet } from '@/components/EndpointDetailSheet';
import { useRunnerStore } from '@/lib/store';

export default function Home() {
  const { loadDemoCollection, collectionName } = useRunnerStore();

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
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Local Secrets & Privacy Guarantee Banner */}
        <PrivacyBanner />

        {/* Upload Zone */}
        <UploadZone />

        {/* Split Grid: Left Tree Selector & Right Live Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Hierarchical Tree View Selector (4 cols) */}
          <div className="lg:col-span-4 h-[780px]">
            <TreeView />
          </div>

          {/* Right Column: Execution Engine & Telemetry Dashboard (8 cols) */}
          <div className="lg:col-span-8 h-[780px]">
            <RunnerDashboard />
          </div>

        </div>

        {/* Real-time Traffic & Routing Simulator */}
        <LiveTrafficSimulator />

        {/* Technical Architecture, Tech Stack & AWS Cloud Guide */}
        <AppDocumentationSection />

      </main>

      {/* Slide-out Drawer for Detailed HTTP Logs & Assertions */}
      <EndpointDetailSheet />
    </div>
  );
}
