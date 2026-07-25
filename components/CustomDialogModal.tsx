'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface CustomDialogModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onClose: () => void;
}

export const CustomDialogModal: React.FC<CustomDialogModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  onClose
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const isError = type === 'error' || type === 'warning';
  const isSuccess = type === 'success';

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
      <div className={`w-full max-w-md rounded-3xl border ${
        isError ? 'border-red-900/80 bg-[#0f172a]' : isSuccess ? 'border-emerald-800/80 bg-[#0f172a]' : 'border-slate-800 bg-[#0f172a]'
      } p-6 shadow-2xl space-y-4 text-left`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
            }`}>
              {isError ? <AlertTriangle className="h-5 w-5" /> : isSuccess ? <CheckCircle2 className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Interactive System Notification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed break-words font-sans">
          {message}
        </p>

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-5 py-2 text-xs font-extrabold text-white shadow-lg transition-all ${
              isError ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : isSuccess ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            OK, Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
