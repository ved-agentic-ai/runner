'use client';

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, Award } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

export const PciComplianceBanner: React.FC = () => {
  const { showPciCompliance } = useAdminStore();

  if (!showPciCompliance) return null;

  return (
    <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-slate-300 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2 font-bold text-white">
              <span>PCI-DSS Level 1 Compliant Payment Gateway</span>
              <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                <Award className="h-3 w-3 text-emerald-400" />
                <span>SAQ-A Certified</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              All payment transactions are processed strictly via Stripe & PayPal end-to-end 256-Bit SSL encrypted tokens. No raw cardholder data is stored on our servers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-emerald-300 font-medium shrink-0 self-end md:self-center">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-400" /> 256-Bit SSL
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Zero Card Leak Risk
          </span>
        </div>

      </div>
    </div>
  );
};
