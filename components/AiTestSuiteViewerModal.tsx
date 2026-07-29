'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Search, 
  FileCode
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { generateSmartHeuristicTests } from '@/lib/ai-test-generator';
import { EndpointTestSuite } from '@/lib/types';

export const AiTestSuiteViewerModal: React.FC = () => {
  const { generatedTestSuites, flatEndpointMap, serverFlatEndpointMap, activeWorkspaceSource, rootNodes, serverRootNodes, collectionName } = useRunnerStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeFlatMap = useMemo(() => {
    if ((activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0)) {
      return serverFlatEndpointMap;
    }
    return flatEndpointMap;
  }, [activeWorkspaceSource, rootNodes, serverRootNodes, flatEndpointMap, serverFlatEndpointMap]);

  const suitesList = useMemo(() => {
    const suitesMap: Record<string, EndpointTestSuite> = { ...generatedTestSuites };

    if (activeFlatMap && typeof activeFlatMap.forEach === 'function') {
      activeFlatMap.forEach((node, id) => {
        if (!suitesMap[id]) {
          suitesMap[id] = generateSmartHeuristicTests(node, node.url || '');
        }
      });
    }

    return Object.values(suitesMap);
  }, [generatedTestSuites, activeFlatMap]);

  const filteredSuites = suitesList.filter(s => 
    s.endpointName.toLowerCase().includes(search.toLowerCase()) || 
    s.url.toLowerCase().includes(search.toLowerCase())
  );

  const totalTestCases = suitesList.reduce((acc, s) => acc + (s.testCases?.length || 0), 0);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200 text-left">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                All AI Generated Test Rules ({totalTestCases} Total Rules across {suitesList.length} Endpoints)
              </h2>
              <p className="text-xs text-slate-400">
                Collection: <span className="text-slate-200">{collectionName || 'Default Collection'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter test suites by endpoint name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* List of Suites */}
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {filteredSuites.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No AI test suites found matching "{search}".
            </div>
          ) : (
            filteredSuites.map((suite) => {
              return (
                <div key={suite.endpointId} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        suite.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        suite.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                        suite.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {suite.method}
                      </span>
                      <span className="font-bold text-xs text-slate-200">{suite.endpointName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({suite.url})</span>
                      {suite.userCustomized && (
                        <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 text-[9px] font-bold">
                          ✍ User Customized
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-purple-400 font-semibold bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-md">
                      {suite.testCases?.length || 0} Test Rules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suite.testCases.map((tc, idx) => (
                      <div key={tc.id || idx} className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs space-y-1">
                        <div className="flex items-center justify-between font-medium text-slate-200">
                          <span className="truncate flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            #{idx + 1} {tc.description}
                          </span>
                        </div>
                        {tc.expectedValue !== undefined && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Expected: <code className="text-purple-400">{String(tc.expectedValue)}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-950/60 px-3 py-1.5 text-xs font-medium text-purple-300 border border-purple-800/60 hover:bg-purple-900/80 transition-all shadow-sm whitespace-nowrap"
        title="View all generated AI test scripts for all endpoints"
      >
        <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        <span>View All AI Test Rules ({totalTestCases})</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
