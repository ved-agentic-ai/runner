'use client';

import React, { useEffect, useState } from 'react';
import { Palette, Moon, Sun, Sparkles, Gem } from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useRunnerStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme with HTML document element data attribute & body class
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('theme-midnight', 'theme-emerald');
    } else if (theme === 'midnight') {
      root.classList.add('theme-midnight');
      root.classList.remove('light-theme', 'theme-emerald');
    } else if (theme === 'emerald') {
      root.classList.add('theme-emerald');
      root.classList.remove('light-theme', 'theme-midnight');
    } else {
      root.classList.remove('light-theme', 'theme-midnight', 'theme-emerald');
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  const themeOptions = [
    { id: 'dark', label: 'Dark Cyber', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-950/60 border-indigo-800' },
    { id: 'midnight', label: 'Midnight Blue', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-950/60 border-cyan-800' },
    { id: 'emerald', label: 'Emerald Matrix', icon: Gem, color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800' },
    { id: 'light', label: 'Light Clean Pro', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-800' },
  ] as const;

  const currentOption = themeOptions.find((t) => t.id === theme) || themeOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm shrink-0"
        title="Switch Application Theme Aesthetics"
      >
        <Palette className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span className="hidden md:inline text-slate-300 font-mono text-[11px]">Theme:</span>
        <span className={`flex items-center gap-1 font-mono text-[11px] ${currentOption.color}`}>
          <CurrentIcon className="h-3 w-3 shrink-0" />
          <span>{currentOption.label}</span>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-slate-800 bg-[#0f172a] p-2 shadow-2xl space-y-1 animate-in fade-in duration-150">
            <div className="px-2.5 py-1 border-b border-slate-800 text-[10px] uppercase font-mono font-bold text-slate-400 flex items-center justify-between">
              <span>Select Color Aesthetics</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
            </div>

            {themeOptions.map((opt) => {
              const IconComp = opt.icon;
              const isActive = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id as any);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    isActive
                      ? `${opt.bg} ${opt.color} border shadow-md`
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <IconComp className={`h-4 w-4 ${opt.color}`} />
                    <span>{opt.label}</span>
                  </div>
                  {isActive && <span className="text-amber-400 text-[10px]">✓ Active</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
