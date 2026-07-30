'use client';

import React, { useState } from 'react';
import { 
  Wrench, 
  Eye, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { useRunnerStore } from '@/lib/store';

export const ReleasePipelineBar: React.FC = () => {
  const { 
    releaseEnvironment, 
    setReleaseEnvironment, 
    promoteEnvironment, 
    rollbackEnvironment,
    previewSnapshotAt,
    liveSnapshotAt,
    anonymousMode
  } = useAdminStore();

  const [notification, setNotification] = useState<string | null>(null);

  if (anonymousMode) return null;

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePushToPreview = () => {
    promoteEnvironment('preview');
    triggerNotification('🚀 Dev changes pushed to PREVIEW environment for verification!');
  };

  const handlePromoteToLive = () => {
    promoteEnvironment('live');
    triggerNotification('🌟 Preview build successfully promoted to LIVE production environment!');
  };

  const handleRollbackToDev = () => {
    rollbackEnvironment('dev');
    triggerNotification('🔙 Switched back to DEV environment for further editing.');
  };

  const handleRollbackToPreview = () => {
    rollbackEnvironment('preview');
    triggerNotification('🔄 Rolled back LIVE production to PREVIEW staging version.');
  };

  return (
    <div className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-2 sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left Side: Environment Selector Tabs & Status */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Release Mode:
          </span>

          {/* 3-Mode Selector Tabs */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-2xl border border-slate-800/80 text-xs">
            
            {/* 1. DEV Mode Button */}
            <button
              onClick={() => setReleaseEnvironment('dev')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                releaseEnvironment === 'dev'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="DEV: All ongoing development changes. Isolated from stable live app."
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>1. DEV Sandbox</span>
              {releaseEnvironment === 'dev' && <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse ml-1" />}
            </button>

            {/* 2. PREVIEW Mode Button */}
            <button
              onClick={() => setReleaseEnvironment('preview')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                releaseEnvironment === 'preview'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="PREVIEW: Pre-live staging view to verify changes before pushing live."
            >
              <Eye className="h-3.5 w-3.5" />
              <span>2. PREVIEW Staging</span>
              {releaseEnvironment === 'preview' && <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse ml-1" />}
            </button>

            {/* 3. LIVE Mode Button */}
            <button
              onClick={() => setReleaseEnvironment('live')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-extrabold transition-all ${
                releaseEnvironment === 'live'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="LIVE: Production stable version seen by end-users."
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>3. LIVE Production</span>
              {releaseEnvironment === 'live' && <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse ml-1" />}
            </button>
          </div>
        </div>

        {/* Center: Live Notification Alert */}
        {notification && (
          <div className="flex items-center space-x-2 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-300 animate-in fade-in">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 animate-spin" />
            <span>{notification}</span>
          </div>
        )}

        {/* Right Side: Active Environment Status Pill */}
        <div className="flex items-center space-x-2 shrink-0 text-xs">
          {releaseEnvironment === 'dev' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 font-bold">
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Dev Sandbox Mode</span>
            </span>
          )}
          {releaseEnvironment === 'preview' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-300 font-bold">
              <Eye className="h-3.5 w-3.5 text-purple-400" />
              <span>Pre-Live Verification</span>
            </span>
          )}
          {releaseEnvironment === 'live' && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Live Production Active</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
