'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sliders, 
  Key, 
  FileText, 
  Sparkles, 
  Copy, 
  Plus, 
  Trash2, 
  ArrowUp,
  Maximize2,
  Minimize2,
  Check,
  Code,
  ShieldCheck
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { HttpMethod } from '@/lib/types';

interface ParamItem {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

interface HeaderItem {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

export const EndpointWorkbench: React.FC = () => {
  const {
    selectedEndpointIdForDetail,
    setSelectedEndpointIdForDetail,
    flatEndpointMap,
    serverFlatEndpointMap,
    executionResults,
    generatedTestSuites,
    runSelectedEndpoints,
    maximizedPane,
    setMaximizedPane
  } = useRunnerStore();

  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'assertions'>('body');
  const [running, setRunning] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const workbenchScrollRef = useRef<HTMLDivElement>(null);

  // Safe helper to fetch endpoint node from either flatMap (Map or Record)
  const endpointNode = useMemo(() => {
    if (!selectedEndpointIdForDetail) return undefined;
    
    if (flatEndpointMap && typeof (flatEndpointMap as any).get === 'function') {
      const node = (flatEndpointMap as Map<string, any>).get(selectedEndpointIdForDetail);
      if (node) return node;
    } else if (flatEndpointMap && (flatEndpointMap as any)[selectedEndpointIdForDetail]) {
      return (flatEndpointMap as any)[selectedEndpointIdForDetail];
    }

    if (serverFlatEndpointMap && typeof (serverFlatEndpointMap as any).get === 'function') {
      const node = (serverFlatEndpointMap as Map<string, any>).get(selectedEndpointIdForDetail);
      if (node) return node;
    } else if (serverFlatEndpointMap && (serverFlatEndpointMap as any)[selectedEndpointIdForDetail]) {
      return (serverFlatEndpointMap as any)[selectedEndpointIdForDetail];
    }

    return undefined;
  }, [selectedEndpointIdForDetail, flatEndpointMap, serverFlatEndpointMap]);
  const result = selectedEndpointIdForDetail ? executionResults[selectedEndpointIdForDetail] : undefined;
  const testSuite = selectedEndpointIdForDetail ? generatedTestSuites[selectedEndpointIdForDetail] : undefined;

  // Form State
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [params, setParams] = useState<ParamItem[]>([
    { id: '1', enabled: true, key: 'mockData', value: 'true' },
    { id: '2', enabled: true, key: 'filter', value: 'PEP' }
  ]);
  const [authType, setAuthType] = useState<'bearer' | 'apikey' | 'none'>('bearer');
  const [authToken, setAuthToken] = useState('{{bearer_token_secret}}');
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: 'h1', enabled: true, key: 'Content-Type', value: 'application/json' },
    { id: 'h2', enabled: true, key: 'app-key', value: '{{internal-service-app-key}}' },
    { id: 'h3', enabled: true, key: 'Accept', value: 'application/json' }
  ]);
  const [bodyText, setBodyText] = useState<string>('{\n  "businessId": "5561234567",\n  "countryCode": "FI",\n  "screeningTypes": ["INTERNATIONAL_PEP"]\n}');

  // Update workbench values when selected endpoint changes
  useEffect(() => {
    if (!endpointNode) return;

    setMethod(endpointNode.method || 'GET');
    setUrl(endpointNode.url || `https://api.internal-service.com/v1/${endpointNode.name}`);

    if (endpointNode.request?.body?.raw) {
      setBodyText(endpointNode.request.body.raw);
    } else if (endpointNode.name.includes('getCompanyReport')) {
      setBodyText('{\n  "businessId": "5561234567",\n  "countryCode": "FI",\n  "screeningTypes": ["INTERNATIONAL_PEP"]\n}');
    } else if (endpointNode.name.includes('getSanctionCheck')) {
      setBodyText('{\n  "personName": "John Doe",\n  "dateOfBirth": "1985-06-15"\n}');
    }
  }, [selectedEndpointIdForDetail, endpointNode]);

  if (!selectedEndpointIdForDetail || !endpointNode) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl space-y-3 h-[450px]">
        <FileText className="h-10 w-10 text-indigo-400/50 stroke-1" />
        <h3 className="font-bold text-sm text-slate-300">No Endpoint Selected in Workbench</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Click any endpoint in the Collection Hierarchy Tree or Server Explorer to open the interactive Postman-grade Request & Response Workbench.
        </p>
      </div>
    );
  }

  const handleScrollToTop = () => {
    workbenchScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBeautifyJson = () => {
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Invalid JSON syntax ignore
    }
  };

  const handleSendSingle = async () => {
    setRunning(true);
    
    // Trigger run single endpoint
    await useRunnerStore.getState().runSelectedEndpoints();
    setRunning(false);

    // Auto-fit telemetry pane side by side as requested by user
    if (maximizedPane === 'tree') {
      setMaximizedPane(null);
    }
  };

  const handleCopyResponse = () => {
    const textToCopy = result?.responseBody ? JSON.stringify(result.responseBody, null, 2) : 'No response payload';
    navigator.clipboard.writeText(textToCopy);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const methodColorMap: Partial<Record<HttpMethod, string>> = {
    GET: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    POST: 'bg-amber-950/80 text-amber-300 border-amber-800',
    PUT: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    DELETE: 'bg-red-950/80 text-red-300 border-red-800',
    PATCH: 'bg-purple-950/80 text-purple-300 border-purple-800',
  };

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[750px] max-h-[82vh] overflow-hidden text-left font-sans">
      
      {/* WORKBENCH TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        
        {/* Endpoint Name & Method */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${methodColorMap[method] || methodColorMap.GET}`}>
            {method}
          </span>
          <h2 className="font-extrabold text-sm text-white truncate max-w-xs sm:max-w-md">
            {endpointNode.name}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleScrollToTop}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 hover:bg-indigo-900 text-xs font-bold font-mono transition-all shadow-sm"
            title="Scroll to Top of Workbench"
          >
            <ArrowUp className="h-3.5 w-3.5 text-indigo-400" />
            <span>Top</span>
          </button>

          <button
            type="button"
            onClick={handleSendSingle}
            disabled={running}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {running ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 fill-white/20" />}
            <span>{running ? 'Executing...' : '⚡ Send Request'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEndpointIdForDetail(null)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* URL EDIT BAR */}
      <div className="p-3 bg-slate-950 border-b border-slate-900 flex items-center space-x-2 shrink-0">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none"
          placeholder="https://api.example.com/v1/resource"
        />
      </div>

      {/* WORKBENCH SCROLLABLE BODY */}
      <div ref={workbenchScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        
        {/* REQUEST TAB SELECTION BAR */}
        <div className="border-b border-slate-800 pb-2 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveRequestTab('body')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeRequestTab === 'body' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Body</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRequestTab('params')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeRequestTab === 'params' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Params ({params.filter(p => p.enabled).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRequestTab('headers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeRequestTab === 'headers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Headers ({headers.filter(h => h.enabled).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRequestTab('auth')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeRequestTab === 'auth' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Authorization</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRequestTab('assertions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeRequestTab === 'assertions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Assertions ({testSuite?.testCases.length || 3})</span>
          </button>
        </div>

        {/* REQUEST TAB CONTENT PANELS */}
        {activeRequestTab === 'body' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">JSON Payload (raw)</span>
              <button
                type="button"
                onClick={handleBeautifyJson}
                className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-bold hover:bg-indigo-900 transition-all"
              >
                ✨ Beautify JSON
              </button>
            </div>

            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-slate-800 bg-[#090d16] p-3 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {activeRequestTab === 'params' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono">Query Parameters</span>
              <button
                type="button"
                onClick={() => setParams([...params, { id: String(Date.now()), enabled: true, key: '', value: '' }])}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                + Add Parameter
              </button>
            </div>

            <div className="space-y-2">
              {params.map((p, idx) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => {
                      const updated = [...params];
                      updated[idx].enabled = e.target.checked;
                      setParams(updated);
                    }}
                    className="rounded border-slate-800 bg-slate-900 text-indigo-600"
                  />
                  <input
                    type="text"
                    value={p.key}
                    placeholder="Key"
                    onChange={(e) => {
                      const updated = [...params];
                      updated[idx].key = e.target.value;
                      setParams(updated);
                    }}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-200"
                  />
                  <input
                    type="text"
                    value={p.value}
                    placeholder="Value"
                    onChange={(e) => {
                      const updated = [...params];
                      updated[idx].value = e.target.value;
                      setParams(updated);
                    }}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeRequestTab === 'headers' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono">HTTP Headers</span>
              <button
                type="button"
                onClick={() => setHeaders([...headers, { id: String(Date.now()), enabled: true, key: '', value: '' }])}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                + Add Header
              </button>
            </div>

            <div className="space-y-2">
              {headers.map((h, idx) => (
                <div key={h.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={h.enabled}
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].enabled = e.target.checked;
                      setHeaders(updated);
                    }}
                    className="rounded border-slate-800 bg-slate-900 text-indigo-600"
                  />
                  <input
                    type="text"
                    value={h.key}
                    placeholder="Header Key"
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].key = e.target.value;
                      setHeaders(updated);
                    }}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-200"
                  />
                  <input
                    type="text"
                    value={h.value}
                    placeholder="Header Value"
                    onChange={(e) => {
                      const updated = [...headers];
                      updated[idx].value = e.target.value;
                      setHeaders(updated);
                    }}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-mono text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeRequestTab === 'auth' && (
          <div className="space-y-3 text-xs">
            <label className="block font-mono text-slate-400">Authorization Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as any)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 font-mono"
            >
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key</option>
              <option value="none">No Auth</option>
            </select>

            {authType === 'bearer' && (
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400 font-mono">Token Secret</label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
            )}
          </div>
        )}

        {/* RESPONSE SECTION */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
              Response Payload
            </h3>
            {result && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className={`px-2 py-0.5 rounded-md font-extrabold border ${
                  (result.statusCode || 200) >= 200 && (result.statusCode || 200) < 300 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-red-950 text-red-300 border-red-800'
                }`}>
                  {result.statusCode || 200} {(result.statusCode || 200) >= 200 && (result.statusCode || 200) < 300 ? 'OK' : 'Error'}
                </span>
                <span className="text-indigo-400 font-bold">⚡ {result.responseTimeMs} ms</span>
              </div>
            )}
          </div>

          {result ? (
            <div className="rounded-2xl border border-slate-800 bg-[#060a12] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span>Response Body</span>
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedResponse ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-2 leading-relaxed">
                {JSON.stringify(result.responseBody, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-800/80 bg-slate-900/40 text-slate-500 text-xs font-mono">
              Click <strong className="text-indigo-400">⚡ Send Request</strong> above to execute request and inspect live HTTP response payload.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
