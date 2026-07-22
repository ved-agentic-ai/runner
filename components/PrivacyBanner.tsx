'use client';

import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { PrivacySimulationModal } from './PrivacySimulationModal';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="w-full rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4 backdrop-blur-md shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-start md:items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                100% Local Privacy & Secret Protection Guarantee
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-700/50">
                <Lock className="h-3 w-3" /> Zero Secrets Transmitted
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Your environment variables, API keys, bearer tokens, and passwords stay strictly on your local device. Endpoint structural metadata is automatically sanitized and masked before test rule generation.
            </p>
          </div>
        </div>

        {/* Interactive Simulation Trigger */}
        <div className="flex items-center shrink-0 border-t md:border-t-0 md:border-l border-emerald-900/50 pt-3 md:pt-0 md:pl-4">
          <PrivacySimulationModal />
        </div>

      </div>
    </div>
  );
};
