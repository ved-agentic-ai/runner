'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

export const LegalDisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { anonymousMode } = useAdminStore();

  useEffect(() => {
    setMounted(true);
    setIsOpen(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl flex flex-col space-y-5 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-indigo-400 tracking-tight">
            {anonymousMode ? 'Enterprise Platform & Operational Terms' : 'Legal Disclaimer & Creator Statement'}
          </h2>
        </div>

        {/* Disclaimer Text Content */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          {anonymousMode ? (
            <>
              <p>
                Welcome to <strong className="text-slate-100">Enterprise APIRunner Suite</strong>. This platform is configured in <strong className="text-emerald-400">Anonymous Enterprise Mode</strong> for authorized testing, automated endpoint telemetry, and live proxy execution.
              </p>
              <p>
                <strong className="text-slate-100">Security & Privacy:</strong> All local variables, mock data, and security headers are processed locally within your browser context or authorized cloud runner.
              </p>
              <p>
                <strong className="text-slate-100">Operational Advisory:</strong> Telemetry metrics and SLA simulations are provided for system analysis and integration testing.
              </p>
            </>
          ) : (
            <>
              <p>
                This dashboard is a <strong className="text-slate-100">solely personally developed project</strong> created entirely by the developer for educational and portfolio demonstration purposes. It has absolutely no affiliation, endorsement, connection, or association with any company, employer, firm, or external organization.
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
            </>
          )}
        </div>

        {/* Modal Action Button */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
          >
            <span>Confirm & Enter Dashboard</span>
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
