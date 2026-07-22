'use client';

import React from 'react';
import { 
  Key, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { getQuotaState } from '@/lib/quota-tracker';

export const QuotaTelemetryWidget: React.FC = () => {
  const { geminiApiKey } = useRunnerStore();
  const quota = getQuotaState(geminiApiKey);

  const isUserKey = quota.mode === 'user_key';

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`flex items-center space-x-2 rounded-xl border px-3 py-1.5 backdrop-blur-md shadow-sm ${
        isUserKey 
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
          : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
      }`}>
        <Key className={`h-3.5 w-3.5 ${isUserKey ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="font-semibold">
          {isUserKey ? 'User Key (Unlimited)' : `App Demo Key (${quota.requestsUsed}/${quota.maxDemoRequests} Used)`}
        </span>

        <span className="text-slate-600">|</span>

        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
          <Cpu className="h-3 w-3 text-purple-400" /> ~{quota.totalTokensEstimated} Tokens
        </span>

        {quota.rateLimitStatus === 'quota_exceeded' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
            <AlertTriangle className="h-3 w-3" /> Rate Limit (Fallback Active)
          </span>
        )}
      </div>
    </div>
  );
};
