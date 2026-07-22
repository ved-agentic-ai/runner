'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Terminal, 
  FileText,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

export const EndpointDetailSheet: React.FC = () => {
  const { 
    selectedEndpointIdForDetail, 
    setSelectedEndpointIdForDetail, 
    executionResults, 
    flatEndpointMap,
    generatedTestSuites
  } = useRunnerStore();

  const [activeTab, setActiveTab] = useState<'response' | 'request' | 'assertions' | 'curl'>('response');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!selectedEndpointIdForDetail) return null;

  const endpointNode = flatEndpointMap.get(selectedEndpointIdForDetail);
  const result = executionResults[selectedEndpointIdForDetail];
  const testSuite = generatedTestSuites[selectedEndpointIdForDetail];

  if (!endpointNode) return null;

  const formatJson = (str?: string) => {
    if (!str) return 'No body payload';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch (e) {
      return str;
    }
  };

  const generateCurl = () => {
    const url = result?.resolvedUrl || endpointNode.url || 'https://api.example.com';
    const method = endpointNode.method || 'GET';
    let cmd = `curl -X ${method} "${url}"`;

    if (result?.requestHeaders) {
      Object.entries(result.requestHeaders).forEach(([k, v]) => {
        cmd += ` \\\n  -H "${k}: ${v}"`;
      });
    }

    if (result?.requestBody) {
      cmd += ` \\\n  -d '${result.requestBody.replace(/'/g, "\\'")}'`;
    }

    return cmd;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl border-l border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center space-x-3 min-w-0">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                endpointNode.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                endpointNode.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                endpointNode.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {endpointNode.method}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white truncate">{endpointNode.name}</h2>
                <p className="text-xs text-slate-400 truncate font-mono">{result?.resolvedUrl || endpointNode.url}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEndpointIdForDetail(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status Bar */}
          {result && (
            <div className="flex items-center justify-between bg-slate-950/60 px-5 py-2.5 border-b border-slate-800 text-xs">
              <div className="flex items-center space-x-4">
                <span className="flex items-center gap-1.5 font-semibold">
                  Status: 
                  {result.status === 'passed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {result.statusCode} OK</span>}
                  {result.status === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="h-4 w-4" /> {result.statusCode || 'ERROR'}</span>}
                  {result.status === 'pending' && <span className="text-amber-400">Pending</span>}
                </span>

                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> Latency: <strong className="text-slate-200">{result.responseTimeMs} ms</strong>
                </span>
              </div>

              {testSuite && (
                <span className="text-purple-400 font-medium flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {result.assertionResults.filter(a => a.status === 'pass').length}/{result.assertionResults.length} Assertions Passed
                </span>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 px-5">
            {[
              { id: 'response', label: 'Response Body', icon: FileText },
              { id: 'assertions', label: 'AI Assertions', icon: ShieldCheck },
              { id: 'request', label: 'Request & Headers', icon: Sliders },
              { id: 'curl', label: 'cURL Command', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 border-b-2 py-3 px-4 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-950/40">
            {activeTab === 'response' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">HTTP Response Body Payload</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {result?.responseBody ? `${(new Blob([result.responseBody]).size / 1024).toFixed(2)} KB` : '0 KB'}
                  </span>
                </div>
                <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[460px] leading-relaxed shadow-inner custom-scrollbar">
                  {formatJson(result?.responseBody)}
                </pre>
              </div>
            )}

            {activeTab === 'assertions' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">Automated Assertion Results</h3>
                {result?.assertionResults && result.assertionResults.length > 0 ? (
                  result.assertionResults.map((a, idx) => (
                    <div
                      key={a.id || idx}
                      className={`rounded-xl border p-3.5 text-xs flex flex-col space-y-1.5 ${
                        a.status === 'pass' 
                          ? 'border-emerald-900/60 bg-emerald-950/20 text-emerald-200' 
                          : 'border-red-900/60 bg-red-950/20 text-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-2">
                          {a.status === 'pass' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          {a.description}
                        </span>
                        <span className={`uppercase text-[9px] font-bold px-2 py-0.5 rounded ${
                          a.status === 'pass' ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-6">{a.message}</p>
                      <div className="flex items-center gap-4 text-[11px] pl-6 pt-1 font-mono text-slate-400">
                        <span>Expected: <code className="text-slate-200">{String(a.expected)}</code></span>
                        <span>Actual: <code className={a.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}>{String(a.actual)}</code></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Run the collection to see assertion results.</p>
                )}
              </div>
            )}

            {activeTab === 'request' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1.5">Request Headers</h4>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 font-mono text-slate-300">
                    {result?.requestHeaders && Object.keys(result.requestHeaders).length > 0 ? (
                      Object.entries(result.requestHeaders).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-indigo-400">{k}:</span>
                          <span className="text-slate-200">{v}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500">No request headers</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-1.5">Request Body Payload</h4>
                  <pre className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-amber-300 font-mono overflow-x-auto">
                    {formatJson(result?.requestBody || endpointNode.request?.body?.raw)}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'curl' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">cURL Export Snippet</span>
                  <button
                    onClick={handleCopyCurl}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedCurl ? 'Copied to Clipboard!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed">
                  {generateCurl()}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 bg-slate-900 p-4 flex justify-end">
            <button
              onClick={() => setSelectedEndpointIdForDetail(null)}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
};
