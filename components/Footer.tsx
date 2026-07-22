'use client';

import React from 'react';
import { GitBranch, Mail, User, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-6 text-xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-4 px-4 sm:px-6">
        
        {/* Creator Identity */}
        <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-slate-400 text-center sm:text-left">
          <span className="flex items-center space-x-1.5 font-bold text-white text-sm">
            <User className="h-4 w-4 text-indigo-400" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ved Tripathi
            </span>
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-400 text-xs">Architect & Lead Developer</span>
        </div>

        {/* Links: Email & GitHub */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Email */}
          <a
            href="mailto:vedmtripathi@gmail.com"
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 font-medium text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-all shadow-sm"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-400" />
            <span>vedmtripathi@gmail.com</span>
          </a>

          {/* GitHub Repository */}
          <a
            href="https://github.com/ved-agentic-ai/runner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-900/60 bg-indigo-950/40 px-3.5 py-1.5 font-semibold text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm"
          >
            <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
            <span>GitHub: ved-agentic-ai/runner</span>
            <ExternalLink className="h-3 w-3 text-indigo-400" />
          </a>
        </div>

        {/* Copyright & Disclaimer Note */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span>© 2026 Ved Tripathi. All Rights Reserved.</span>
        </div>

      </div>
    </footer>
  );
};
