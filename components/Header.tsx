'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Play, 
  Key, 
  FileCode, 
  FolderPlus, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { EnvironmentManagerModal } from './EnvironmentManagerModal';
import { AiTestSuiteViewerModal } from './AiTestSuiteViewerModal';
import { CustomTestRuleGeneratorModal } from './CustomTestRuleGeneratorModal';
import { QuotaTelemetryWidget } from './QuotaTelemetryWidget';
import { PresentationDeckModal } from './PresentationDeckModal';

export const Header: React.FC = () => {
  const { 
    collectionName, 
    loadDemoCollection, 
    geminiApiKey, 
    setGeminiApiKey, 
    generateAiTestsForSelected,
    runSelectedEndpoints,
    runSummary,
    clearResults
  } = useRunnerStore();

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

  const isRunning = runSummary.status === 'running';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col xl:flex-row xl:items-center justify-between gap-3 px-4 py-3 sm:px-6">
        
        {/* Brand & Active Collection Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Zap className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                API Collection <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Runner</span>
              </h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/20 whitespace-nowrap">
                AI Test Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
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

        {/* Action Controls - Clean Horizontal Bar */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto custom-scrollbar max-w-full">
          
          {/* Quota & Token Monitor Widget */}
          <QuotaTelemetryWidget />

          {/* Postman-Style Environment Manager Button */}
          <EnvironmentManagerModal />

          {/* Stakeholder Presentation Deck Modal */}
          <PresentationDeckModal />

          {/* Natural Language Custom Test Generator Button */}
          <CustomTestRuleGeneratorModal />

          {/* View All AI Test Rules Button */}
          <AiTestSuiteViewerModal />

          {/* Load Sample Preset Button */}
          <button
            onClick={loadDemoCollection}
            className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm whitespace-nowrap"
            title="Load JSONPlaceholder & ReqRes Demo Collection"
          >
            <FolderPlus className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span>Load Demo API</span>
          </button>

          {/* AI Key Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`inline-flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all shadow-sm whitespace-nowrap ${
              geminiApiKey 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Key className={`h-3.5 w-3.5 shrink-0 ${geminiApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{geminiApiKey ? 'AI Key Configured' : 'Configure AI API Key'}</span>
          </button>

          {/* Clear Results */}
          {runSummary.total > 0 && (
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="inline-flex items-center space-x-1 rounded-xl bg-slate-900 p-2 text-xs font-medium text-slate-400 border border-slate-800 hover:text-slate-200 transition-all disabled:opacity-50 shrink-0"
              title="Reset Run Results"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Run Selected Button */}
          {collectionName && (
            <button
              onClick={() => runSelectedEndpoints()}
              disabled={isRunning || runSummary.total === 0}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-pink-500 active:scale-[0.98] disabled:opacity-50 transition-all whitespace-nowrap"
            >
              <Play className={`h-3.5 w-3.5 fill-current shrink-0 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Run Selected'}</span>
            </button>
          )}
        </div>
      </div>

      {showKeyModal && mounted && createPortal(keyModalContent, document.body)}
    </header>
  );
};
