'use client';

import React from 'react';
import { 
  Key, 
  Cpu, 
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { getQuotaState } from '@/lib/quota-tracker';

export const QuotaTelemetryWidget: React.FC = () => {
  const { geminiApiKey } = useRunnerStore();
  const quota = getQuotaState(geminiApiKey);

  const isUserKey = quota.mode === 'user_key';
  const percentage = Math.min(100, Math.round((quota.requestsUsed / quota.maxDemoRequests) * 100));

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`flex items-center space-x-2.5 rounded-xl border px-3 py-1.5 backdrop-blur-md shadow-sm transition-all ${
        isUserKey 
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
          : quota.requestsUsed >= quota.maxDemoRequests
            ? 'bg-red-950/40 border-red-800/60 text-red-300'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
      }`}>
        <Key className={`h-3.5 w-3.5 shrink-0 ${isUserKey ? 'text-emerald-400' : 'text-amber-400'}`} />
        
        <div className="flex items-center space-x-2">
          <span className="font-bold">
            {isUserKey ? '🔑 User Key (Unlimited)' : `🆓 App Demo Key (${quota.requestsUsed}/${quota.maxDemoRequests} Calls)`}
          </span>

          {!isUserKey && (
            <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 hidden sm:block">
              <div 
                className={`h-full transition-all duration-300 ${percentage >= 100 ? 'bg-red-500' : 'bg-amber-400'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        <span className="text-slate-700">|</span>

        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
          <Cpu className="h-3 w-3 text-purple-400 shrink-0" /> ~{quota.totalTokensEstimated} Tokens
        </span>

        {quota.rateLimitStatus === 'quota_exceeded' && !isUserKey && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
            <AlertTriangle className="h-3 w-3" /> Fallback Mode Active
          </span>
        )}
      </div>
    </div>
  );
};
