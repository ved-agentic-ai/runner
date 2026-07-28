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
  ShieldCheck,
  Target,
  Send,
  Plus,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

interface HeaderItem {
  enabled: boolean;
  key: string;
  value: string;
}

export const EndpointDetailSheet: React.FC = () => {
  const { 
    inspectorEndpointId,
    setInspectorEndpointId, 
    executionResults, 
    flatEndpointMap,
    generatedTestSuites,
    envVariables
  } = useRunnerStore();

  const [activeTab, setActiveTab] = useState<'response' | 'request' | 'assertions' | 'curl'>('response');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [runningSingle, setRunningSingle] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Editable Postman-style Request Headers & Body
  const [customHeaders, setCustomHeaders] = useState<HeaderItem[]>([]);
  const [customBody, setCustomBody] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const endpointNode = inspectorEndpointId ? flatEndpointMap.get(inspectorEndpointId) : undefined;
  const result = inspectorEndpointId ? executionResults[inspectorEndpointId] : undefined;
  const testSuite = inspectorEndpointId ? generatedTestSuites[inspectorEndpointId] : undefined;

  // Initialize editable headers & body when selected endpoint changes
  useEffect(() => {
    if (!endpointNode) return;

    const initialHeaders: HeaderItem[] = [];

    // Parse headers from Postman request or previous result
    if (result?.requestHeaders && Object.keys(result.requestHeaders).length > 0) {
      Object.entries(result.requestHeaders).forEach(([k, v]) => {
        initialHeaders.push({ enabled: true, key: k, value: String(v) });
      });
    } else if (endpointNode.request?.header && Array.isArray(endpointNode.request.header)) {
      endpointNode.request.header.forEach((h: any) => {
        initialHeaders.push({ enabled: h.disabled !== true, key: h.key || '', value: h.value || '' });
      });
    }

    // Always ensure default Content-Type and app-key are present for testing
    if (!initialHeaders.some((h) => h.key.toLowerCase() === 'content-type')) {
      initialHeaders.push({ enabled: true, key: 'Content-Type', value: 'application/json' });
    }
    if (!initialHeaders.some((h) => h.key.toLowerCase() === 'app-key')) {
      initialHeaders.push({ enabled: true, key: 'app-key', value: '{{internal-service-app-key}}' });
    }

    setCustomHeaders(initialHeaders);

    const bodyStr = result?.requestBody || (typeof endpointNode.request?.body?.raw === 'string' ? endpointNode.request.body.raw : '');
    setCustomBody(bodyStr);
  }, [inspectorEndpointId, endpointNode]);

  if (!inspectorEndpointId || !mounted || !endpointNode) return null;

  const formatJson = (str?: string) => {
    if (!str) return 'No body payload';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch (e) {
      return str;
    }
  };

  const handleAddHeader = () => {
    setCustomHeaders([...customHeaders, { enabled: true, key: '', value: '' }]);
  };

  const handleUpdateHeader = (index: number, field: 'enabled' | 'key' | 'value', val: any) => {
    const next = [...customHeaders];
    next[index] = { ...next[index], [field]: val };
    setCustomHeaders(next);
  };

  const handleDeleteHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, idx) => idx !== index));
  };

  const handleSendSingleRequest = async () => {
    setRunningSingle(true);
    const startMs = Date.now();

    try {
      let resolvedUrl = endpointNode.url || '';
      Object.entries(envVariables).forEach(([k, v]) => {
        resolvedUrl = resolvedUrl.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
      });

      // Build active headers object with env variable substitution
      const activeHeadersObj: Record<string, string> = {};
      customHeaders.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        let val = h.value;
        Object.entries(envVariables).forEach(([envK, envV]) => {
          val = val.replace(new RegExp(`{{\\s*${envK}\\s*}}`, 'g'), envV);
        });
        activeHeadersObj[h.key.trim()] = val;
      });

      let resolvedBody = customBody;
      Object.entries(envVariables).forEach(([k, v]) => {
        resolvedBody = resolvedBody.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
      });

      const res = await fetch('/api/proxy-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: resolvedUrl,
          method: endpointNode.method || 'GET',
          headers: activeHeadersObj,
          body: resolvedBody
        })
      });

      const data = await res.json();
      const endMs = Date.now();

      useRunnerStore.setState((state) => ({
        executionResults: {
          ...state.executionResults,
          [inspectorEndpointId]: {
            endpointId: inspectorEndpointId,
            name: endpointNode.name,
            method: endpointNode.method || 'GET',
            url: endpointNode.url || '',
            resolvedUrl,
            statusCode: data.status || res.status,
            status: (data.status >= 200 && data.status < 300) ? 'passed' : 'failed',
            responseTimeMs: endMs - startMs,
            responseHeaders: data.headers || {},
            responseBody: typeof data.data === 'object' ? JSON.stringify(data.data, null, 2) : String(data.data || ''),
            requestHeaders: activeHeadersObj,
            requestBody: resolvedBody,
            executedAt: new Date().toISOString(),
            assertionResults: testSuite ? testSuite.testCases.map((tc) => ({
              id: tc.id,
              description: tc.description,
              status: (data.status >= 200 && data.status < 300) ? 'pass' : 'fail',
              expected: tc.expectedValue !== undefined ? String(tc.expectedValue) : '200 OK',
              actual: `HTTP ${data.status || res.status}`
            })) : []
          }
        }
      }));

    } catch (err: any) {
      useRunnerStore.setState((state) => ({
        executionResults: {
          ...state.executionResults,
          [inspectorEndpointId]: {
            endpointId: inspectorEndpointId,
            name: endpointNode.name,
            method: endpointNode.method || 'GET',
            url: endpointNode.url || '',
            resolvedUrl: endpointNode.url || '',
            statusCode: 500,
            status: 'failed',
            responseTimeMs: Date.now() - startMs,
            responseHeaders: {},
            responseBody: String(err.message || 'Execution error'),
            requestHeaders: {},
            requestBody: customBody,
            executedAt: new Date().toISOString(),
            assertionResults: []
          }
        }
      }));
    }

    setRunningSingle(false);
  };

  const handleHighlightInTree = () => {
    useRunnerStore.setState({ selectedNodeIds: [inspectorEndpointId] });
    setInspectorEndpointId(null);
  };

  const generateCurl = () => {
    const url = result?.resolvedUrl || endpointNode.url || 'https://api.example.com';
    const method = endpointNode.method || 'GET';
    let cmd = `curl -X ${method} "${url}"`;

    customHeaders.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
      cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
    });

    if (customBody) {
      cmd += ` \\\n  -d '${customBody.replace(/'/g, "\\'")}'`;
    }

    return cmd;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 text-left">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl border-l border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/80">
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

            <div className="flex items-center space-x-2">
              <button
                onClick={handleHighlightInTree}
                className="inline-flex items-center space-x-1 rounded-xl border border-indigo-800 bg-indigo-950/60 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900"
                title="Highlight in Tree"
              >
                <Target className="h-3.5 w-3.5" />
                <span>Tree</span>
              </button>

              <button
                onClick={handleSendSingleRequest}
                disabled={runningSingle}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{runningSingle ? 'Sending...' : '▶ Send'}</span>
              </button>

              <button
                onClick={() => setInspectorEndpointId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Status Bar */}
          {result && (
            <div className="flex items-center justify-between bg-slate-950 px-5 py-2.5 border-b border-slate-800 text-xs">
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
              { id: 'request', label: `Request & Headers (${customHeaders.filter(h => h.enabled).length})`, icon: Sliders },
              { id: 'curl', label: 'cURL Command', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 border-b-2 py-3 px-4 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400 font-bold'
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
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-950/40 space-y-4">
            {activeTab === 'response' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
                  <pre>{formatJson(result?.responseBody)}</pre>
                </div>
              </div>
            )}

            {activeTab === 'assertions' && (
              <div className="space-y-3">
                {result?.assertionResults.map((assertion, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        {assertion.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        {assertion.description}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${assertion.status === 'pass' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                        {assertion.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono pt-1">Expected: {String(assertion.expected)} | Actual: {String(assertion.actual)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* EDITABLE POSTMAN-STYLE REQUEST HEADERS & BODY TAB */}
            {activeTab === 'request' && (
              <div className="space-y-5 font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between mb-2 font-sans">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5 text-indigo-400" /> Postman Request Headers Table:
                    </h4>
                    <button
                      onClick={handleAddHeader}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/80"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Header</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        <tr>
                          <th className="py-2 px-3 w-8">Use</th>
                          <th className="py-2 px-3">Header Key</th>
                          <th className="py-2 px-3">Value</th>
                          <th className="py-2 px-3 w-8 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {customHeaders.map((h, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3">
                              <button
                                type="button"
                                onClick={() => handleUpdateHeader(idx, 'enabled', !h.enabled)}
                                className="text-indigo-400"
                              >
                                {h.enabled ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
                              </button>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Header Key (e.g. app-key)..."
                                value={h.key}
                                onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                                className="w-full bg-transparent border-b border-slate-800 px-1 py-0.5 text-xs text-indigo-300 focus:border-indigo-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Value (e.g. {{internal-service-app-key}})..."
                                value={h.value}
                                onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                                className="w-full bg-transparent border-b border-slate-800 px-1 py-0.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteHeader(idx)}
                                className="text-slate-600 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 font-sans mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-purple-400" /> Request Body Payload (JSON/Raw):
                  </h4>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <textarea
                      rows={8}
                      placeholder='{ "key": "value" }'
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-200 font-mono focus:outline-none custom-scrollbar"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'curl' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono">cURL Command Snippet</span>
                  <button
                    onClick={handleCopyCurl}
                    className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-indigo-300 leading-relaxed overflow-x-auto">
                  <pre>{generateCurl()}</pre>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
