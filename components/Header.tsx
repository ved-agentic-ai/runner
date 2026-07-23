'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Key, 
  FileCode, 
  FolderPlus, 
  Zap,
  Sparkles
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { EnvironmentManagerModal } from './EnvironmentManagerModal';
import { AiTestSuiteViewerModal } from './AiTestSuiteViewerModal';
import { CustomTestRuleGeneratorModal } from './CustomTestRuleGeneratorModal';
import { QuotaTelemetryWidget } from './QuotaTelemetryWidget';
import { PresentationDeckModal } from './PresentationDeckModal';
import { AdminControlPanelModal } from './AdminControlPanelModal';
import { PricingCheckoutModal } from './PricingCheckoutModal';
import { useAdminStore } from '@/lib/admin-store';

export const Header: React.FC = () => {
  const { 
    collectionName, 
    loadDemoCollection, 
    geminiApiKey, 
    setGeminiApiKey, 
    generateAiTestsForSelected
  } = useRunnerStore();

  const { 
    showHeaderControls, 
    showSaaSUpgrades,
    showQuotaTelemetry,
    showPresetButton,
    showAiKeyButton,
    workspaceMode
  } = useAdminStore();

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [keyInput, setKeyInput] = useState(geminiApiKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSaveKey = () => {
    setGeminiApiKey(keyInput);
    setShowKeyModal(false);
    generateAiTestsForSelected();
  };

  const keyModalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-base">
            <Key className="h-5 w-5" />
            <span>AI Test Generator API Key</span>
          </div>
          <button 
            onClick={() => setShowKeyModal(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          Optional: Enter your API key to enable unlimited dynamic AI test assertion generation. If omitted, the app provided key is used (capped at 3 requests max before switching to local fallback).
        </p>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            AI API Key
          </label>
          <input
            type="password"
            placeholder="Enter your Gemini API Key..."
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => setShowKeyModal(false)}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveKey}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
          >
            Save & Regenerate Tests
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
      {/* ROW 1: BRAND TITLE & PRIMARY SYSTEM CONTROLS */}
      <div className="mx-auto flex max-w-[1600px] flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        
        {/* Brand & Active Collection Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight text-white whitespace-nowrap">
                Vkratim <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">APIRunner</span>
              </h1>
              <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border whitespace-nowrap ${
                workspaceMode === 'light' 
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' 
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
              }`}>
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{workspaceMode === 'light' ? 'Light Team Mode' : 'Full Enterprise'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {collectionName ? (
                <span className="flex items-center gap-1 text-slate-300 truncate">
                  <FileCode className="h-3 w-3 shrink-0 text-indigo-400" /> <span className="truncate">{collectionName}</span>
                </span>
              ) : (
                'Upload or select a Postman Collection to start'
              )}
            </p>
          </div>
        </div>

        {/* PRIMARY CONTROLS (Row 1 Right) */}
        {showHeaderControls && (
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 shrink-0">
            {/* Owner & Admin Control Panel */}
            <AdminControlPanelModal />

            {/* Quota & Token Monitor Widget (Configurable) */}
            {showQuotaTelemetry && <QuotaTelemetryWidget />}

            {/* Postman-Style Environment Manager Button */}
            <EnvironmentManagerModal />

            {/* SaaS Upgrade & Subscription Button (Hidden in Light Mode or if toggled off) */}
            {workspaceMode === 'full' && showSaaSUpgrades && <PricingCheckoutModal />}

            {/* Stakeholder Presentation Deck Modal */}
            <PresentationDeckModal />
          </div>
        )}
      </div>

      {/* ROW 2: AI ENGINE & WORKSPACE PRESET TOOLBAR */}
      {showHeaderControls && (
        <div className="border-t border-slate-900 bg-slate-950/60 px-4 py-1.5 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
            
            {/* Left Side AI Engine Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Natural Language Custom Test Generator Button */}
              {workspaceMode === 'full' && <CustomTestRuleGeneratorModal />}

              {/* View All AI Test Rules Button */}
              {workspaceMode === 'full' && <AiTestSuiteViewerModal />}
            </div>

            {/* Right Side Workspace Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Load Sample Preset Button (Configurable) */}
              {showPresetButton && (
                <button
                  onClick={loadDemoCollection}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm whitespace-nowrap"
                  title="Load JSONPlaceholder & ReqRes Demo Collection"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Load Demo API Collection</span>
                </button>
              )}

              {/* AI Key Button (Configurable) */}
              {showAiKeyButton && (
                <button
                  onClick={() => setShowKeyModal(true)}
                  className={`inline-flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all shadow-sm whitespace-nowrap ${
                    geminiApiKey 
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50' 
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Key className={`h-3.5 w-3.5 shrink-0 ${geminiApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>{geminiApiKey ? 'AI API Key Configured' : 'Configure AI API Key'}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {showKeyModal && mounted && createPortal(keyModalContent, document.body)}
    </header>
  );
};
