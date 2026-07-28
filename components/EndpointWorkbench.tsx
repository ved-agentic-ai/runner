'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
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
  Check,
  Code,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  Edit3,
  Save
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { HttpMethod, EndpointTestSuite } from '@/lib/types';

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

interface AssertionItem {
  id: string;
  description: string;
  type: 'status' | 'body' | 'header' | 'custom';
  expectedValue: string;
  jsonPath?: string;
}

// ─── Env Var Placeholder Chip (click-based reveal, not hover) ─────────────────
const SECRET_KEYS = ['token', 'secret', 'key', 'password', 'pwd', 'auth', 'bearer', 'api_key', 'apikey'];

const EnvVarChip: React.FC<{ varName: string; envVariables: Record<string, string> }> = ({ varName, envVariables }) => {
  const [open, setOpen] = useState(false);
  const [showPlain, setShowPlain] = useState(false);
  const value = envVariables[varName];
  const isSecret = SECRET_KEYS.some(k => varName.toLowerCase().includes(k));
  const hasValue = value !== undefined && value !== '';
  const displayValue = isSecret && !showPlain ? '••••••••••' : (value || '⚠ not set');

  return (
    <span className="relative inline-flex items-center gap-0.5" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="inline-flex items-center gap-1 rounded-md border border-indigo-700/60 bg-indigo-950/50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 hover:border-indigo-500 hover:bg-indigo-900/60 transition-colors"
      >
        <span className="text-indigo-500">{'{{'}  </span>
        {varName}
        <span className="text-indigo-500">{' }}'}  </span>
      </button>
      {open && (
        <span
          className="absolute top-full left-0 mt-1 z-[999] flex items-center gap-2 min-w-max rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={`font-mono select-all ${hasValue ? (isSecret && !showPlain ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400'}`}>
            {displayValue}
          </span>
          {hasValue && isSecret && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowPlain(v => !v); }}
              className="text-slate-400 hover:text-white transition-colors"
              title={showPlain ? 'Hide value' : 'Show plain text'}
            >
              {showPlain ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
          <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-white ml-1">
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
    </span>
  );
};

// ─── Parse env placeholders in a string and render as chips ──────────────────
const EnvString: React.FC<{ value: string; envVariables: Record<string, string> }> = ({ value, envVariables }) => {
  const parts = value.split(/({{[^}]+}})/g);
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5 font-mono text-xs">
      {parts.map((part, i) => {
        const match = part.match(/^{{(.+)}}$/);
        if (match) {
          return <EnvVarChip key={i} varName={match[1].trim()} envVariables={envVariables} />;
        }
        return part ? <span key={i} className="text-slate-300">{part}</span> : null;
      })}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const EndpointWorkbench: React.FC = () => {
  const {
    selectedEndpointIdForDetail,
    setSelectedEndpointIdForDetail,
    flatEndpointMap,
    serverFlatEndpointMap,
    executionResults,
    generatedTestSuites,
    envVariables,
  } = useRunnerStore();

  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'assertions'>('body');
  const [running, setRunning] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const workbenchScrollRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [showTopFAB, setShowTopFAB] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState('');

  // Isolated single-run result (NOT written to the global executionResults)
  const [singleResult, setSingleResult] = useState<any>(null);

  // AI assertions (editable + collapsible)
  const [customAssertions, setCustomAssertions] = useState<AssertionItem[]>([]);
  const [assertionsModified, setAssertionsModified] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [assertionsCollapsed, setAssertionsCollapsed] = useState(false);

  // Safe lookup across both maps
  const endpointNode = useMemo(() => {
    if (!selectedEndpointIdForDetail) return undefined;
    const id = selectedEndpointIdForDetail;

    if (flatEndpointMap instanceof Map) {
      const n = (flatEndpointMap as Map<string, any>).get(id);
      if (n) return n;
    } else if (flatEndpointMap && (flatEndpointMap as any)[id]) {
      return (flatEndpointMap as any)[id];
    }

    if (serverFlatEndpointMap instanceof Map) {
      const n = (serverFlatEndpointMap as Map<string, any>).get(id);
      if (n) return n;
    } else if (serverFlatEndpointMap && (serverFlatEndpointMap as any)[id]) {
      return (serverFlatEndpointMap as any)[id];
    }

    return undefined;
  }, [selectedEndpointIdForDetail, flatEndpointMap, serverFlatEndpointMap]);

  const testSuite = selectedEndpointIdForDetail ? generatedTestSuites[selectedEndpointIdForDetail] : undefined;

  // Form state
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [params, setParams] = useState<ParamItem[]>([
    { id: '1', enabled: true, key: 'mockData', value: 'true' },
  ]);
  const [authType, setAuthType] = useState<'bearer' | 'apikey' | 'none'>('bearer');
  const [authToken, setAuthToken] = useState('{{bearer_token_secret}}');
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: 'h1', enabled: true, key: 'Content-Type', value: 'application/json' },
    { id: 'h2', enabled: true, key: 'app-key', value: '{{internal-service-app-key}}' },
    { id: 'h3', enabled: true, key: 'Accept', value: 'application/json' },
  ]);
  const [bodyText, setBodyText] = useState('{\n  "businessId": "5561234567",\n  "countryCode": "FI"\n}');

  // Reset form + result when selected endpoint changes
  useEffect(() => {
    if (!endpointNode) return;

    setMethod(endpointNode.method || 'GET');
    setUrl(endpointNode.url || '');
    setSingleResult(null);
    setAssertionsModified(false);

    // Populate body from node
    if (endpointNode.request?.body?.raw) {
      setBodyText(endpointNode.request.body.raw);
    }

    // Populate headers from node
    if (endpointNode.request?.header && Array.isArray(endpointNode.request.header)) {
      const nodeHeaders: HeaderItem[] = endpointNode.request.header.map((h: any, i: number) => ({
        id: `h${i}`,
        enabled: h.disabled !== true,
        key: h.key || '',
        value: h.value || '',
      }));
      if (!nodeHeaders.some((h: any) => h.key.toLowerCase() === 'content-type')) {
        nodeHeaders.push({ id: 'hct', enabled: true, key: 'Content-Type', value: 'application/json' });
      }
      if (!nodeHeaders.some((h: any) => h.key.toLowerCase() === 'app-key')) {
        nodeHeaders.push({ id: 'hak', enabled: true, key: 'app-key', value: '{{internal-service-app-key}}' });
      }
      setHeaders(nodeHeaders);
    }

    // Populate assertions from test suite
    if (testSuite?.testCases?.length) {
      setCustomAssertions(testSuite.testCases.map((tc: any) => ({
        id: tc.id,
        description: tc.description || '',
        type: tc.assertionType || 'status',
        expectedValue: tc.expectedValue !== undefined ? String(tc.expectedValue) : '200',
        jsonPath: tc.jsonPath || '',
      })));
    } else {
      setCustomAssertions([
        { id: 'a1', description: 'Response status is 200 OK', type: 'status', expectedValue: '200' },
        { id: 'a2', description: 'Response body is not empty', type: 'body', expectedValue: '' },
        { id: 'a3', description: 'Content-Type is application/json', type: 'header', expectedValue: 'application/json', jsonPath: 'content-type' },
      ]);
    }
  }, [selectedEndpointIdForDetail, endpointNode]);

  // Scroll FAB
  const handleWorkbenchScroll = useCallback(() => {
    setShowTopFAB((workbenchScrollRef.current?.scrollTop || 0) > 80);
  }, []);

  const handleScrollToTop = () => workbenchScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const handleBeautifyJson = () => {
    try { setBodyText(JSON.stringify(JSON.parse(bodyText), null, 2)); } catch (_) {}
  };

  // ── Close with save-dialog if assertions modified ─────────────────────────
  const handleClose = () => {
    if (assertionsModified) {
      setShowSaveDialog(true);
    } else {
      setSelectedEndpointIdForDetail(null);
    }
  };

  const handleSaveAssertions = () => {
    if (selectedEndpointIdForDetail) {
      const existing = useRunnerStore.getState().generatedTestSuites[selectedEndpointIdForDetail];
      const updated: EndpointTestSuite = {
        endpointId: selectedEndpointIdForDetail,
        endpointName: endpointNode?.name || '',
        method: (endpointNode?.method || 'GET') as HttpMethod,
        url: endpointNode?.url || '',
        generatedBy: existing?.generatedBy || 'smart_heuristic',
        summary: existing?.summary || 'User customized assertions',
        userCustomized: true,
        testCases: customAssertions.map((a) => ({
          id: a.id,
          type: a.type as any,
          description: a.description,
          expectedValue: a.expectedValue,
          jsonPath: a.jsonPath,
        })),
      };
      useRunnerStore.setState((state) => ({
        generatedTestSuites: {
          ...state.generatedTestSuites,
          [selectedEndpointIdForDetail]: updated,
        },
      }));
    }
    setShowSaveDialog(false);
    setAssertionsModified(false);
    setSelectedEndpointIdForDetail(null);
  };

  // ── Send Request (isolated, does NOT affect global executionResults) ──────
  const handleSendSingle = async () => {
    if (!selectedEndpointIdForDetail || !endpointNode) return;
    setRunning(true);
    const startMs = Date.now();
    setSingleResult(null);

    try {
      const env = useRunnerStore.getState().envVariables;
      const resolveVars = (s: string) =>
        Object.entries(env).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v), s);

      // Build URL + query params
      let resolvedUrl = resolveVars(url || endpointNode.url || '');
      const enabledParams = params.filter((p) => p.enabled && p.key.trim());
      if (enabledParams.length > 0) {
        const qs = enabledParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(resolveVars(p.value))}`).join('&');
        resolvedUrl = `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}${qs}`;
      }

      // Build headers
      const activeHeaders: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        activeHeaders[h.key.trim()] = resolveVars(h.value);
      });

      // Auth
      if (authType === 'bearer' && authToken) {
        activeHeaders['Authorization'] = `Bearer ${resolveVars(authToken)}`;
      } else if (authType === 'apikey' && authToken) {
        activeHeaders['X-API-Key'] = resolveVars(authToken);
      }

      const resolvedBody = resolveVars(bodyText);

      const res = await fetch('/api/proxy-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: resolvedUrl,
          method: method || endpointNode.method || 'GET',
          headers: activeHeaders,
          body: resolvedBody,
        }),
      });

      const data = await res.json();
      const endMs = Date.now();
      const httpStatus = data.status ?? res.status;
      const isSuccess = httpStatus >= 200 && httpStatus < 300;

      // Parse response body correctly (avoid double-JSON.stringify)
      let responseBodyStr = '';
      if (data.data !== undefined && data.data !== null) {
        if (typeof data.data === 'object') {
          responseBodyStr = JSON.stringify(data.data, null, 2);
        } else {
          responseBodyStr = String(data.data);
        }
      } else if (data.body !== undefined) {
        responseBodyStr = typeof data.body === 'object' ? JSON.stringify(data.body, null, 2) : String(data.body);
      }

      // Run assertions against response
      const assertionResults = customAssertions.map((a) => {
        let pass = false;
        if (a.type === 'status') {
          pass = String(httpStatus) === String(a.expectedValue);
        } else if (a.type === 'body') {
          pass = a.expectedValue ? responseBodyStr.includes(a.expectedValue) : responseBodyStr.length > 0;
        } else if (a.type === 'header') {
          const headerVal = (data.headers || {})[a.jsonPath || ''] || '';
          pass = a.expectedValue ? headerVal.toLowerCase().includes(a.expectedValue.toLowerCase()) : !!headerVal;
        } else {
          pass = isSuccess;
        }
        return { id: a.id, description: a.description, status: pass ? 'pass' : 'fail', expected: a.expectedValue, actual: a.type === 'status' ? String(httpStatus) : '' };
      });

      setSingleResult({
        statusCode: httpStatus,
        status: isSuccess ? 'passed' : 'failed',
        responseTimeMs: endMs - startMs,
        responseHeaders: data.headers || {},
        responseBody: responseBodyStr,
        requestHeaders: activeHeaders,
        requestBody: resolvedBody,
        resolvedUrl,
        assertionResults,
        executedAt: new Date().toISOString(),
      });

    } catch (err: any) {
      setSingleResult({
        statusCode: 0,
        status: 'failed',
        responseTimeMs: Date.now() - startMs,
        responseHeaders: {},
        responseBody: `Request failed: ${err.message}`,
        requestHeaders: {},
        requestBody: bodyText,
        resolvedUrl: url,
        assertionResults: [],
        executedAt: new Date().toISOString(),
      });
    }

    setRunning(false);
    // ⚠️ DO NOT call setMaximizedPane(null) — keep user in current layout
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(singleResult?.responseBody || '');
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const methodColors: Partial<Record<HttpMethod, string>> = {
    GET:    'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    POST:   'bg-amber-950/80 text-amber-300 border-amber-800',
    PUT:    'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    DELETE: 'bg-red-950/80 text-red-300 border-red-800',
    PATCH:  'bg-purple-950/80 text-purple-300 border-purple-800',
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!selectedEndpointIdForDetail || !endpointNode) {
    return (
      <div className="flex flex-col rounded-3xl border border-slate-800/60 bg-slate-950/80 shadow-xl overflow-hidden" style={{ minHeight: '460px' }}>
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-950/60 px-3 py-2">
            <span className="text-[11px] font-bold uppercase text-slate-600 select-none px-2 py-0.5 rounded bg-slate-800/60">GET</span>
            <span className="text-[12px] text-slate-600 font-mono truncate">https://api.example.com/endpoint</span>
          </div>
          <button disabled className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/60 px-4 py-2 text-xs font-bold text-slate-600 cursor-not-allowed">
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-5">
          <div className="relative flex items-center justify-center mb-2">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl scale-150" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-950/40 shadow-lg shadow-indigo-500/10">
              <Send className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-200">No Endpoint Selected</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Click any endpoint in the <span className="text-indigo-400 font-semibold">Collection Hierarchy</span> or <span className="text-indigo-400 font-semibold">Server Explorer</span> to open it here.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-sm">
            {[
              { icon: '🌐', label: 'Params', desc: 'Query params' },
              { icon: '🔐', label: 'Auth', desc: 'Bearer / API key' },
              { icon: '📦', label: 'Body', desc: 'JSON / raw payload' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 text-center">
                <span className="text-xl">{icon}</span>
                <span className="text-[11px] font-bold text-slate-400">{label}</span>
                <span className="text-[10px] text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[750px] max-h-[82vh] overflow-hidden text-left font-sans relative">

      {/* ── TITLE BAR ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${methodColors[method] || methodColors.GET}`}>{method}</span>
          <h2 className="font-extrabold text-sm text-white truncate max-w-xs sm:max-w-md">{endpointNode.name}</h2>
          {testSuite?.userCustomized && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              <Edit3 className="h-2.5 w-2.5" /> User Customized
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleSendSingle}
            disabled={running}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {running ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>{running ? 'Executing...' : '⚡ Send Request'}</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* ── URL BAR ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-900 flex items-center space-x-2 shrink-0">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none pr-24"
            placeholder="https://api.example.com/v1/resource"
          />
          {url && url.includes('{{') && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <EnvString value={url} envVariables={envVariables} />
            </div>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────────── */}
      <div
        ref={workbenchScrollRef}
        onScroll={handleWorkbenchScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
      >

        {/* REQUEST TAB NAV */}
        <div className="border-b border-slate-800 pb-0 flex items-center gap-1 overflow-x-auto">
          {([
            { id: 'body',       label: 'Body',          icon: <FileText className="h-3.5 w-3.5" /> },
            { id: 'params',     label: `Params (${params.filter(p=>p.enabled).length})`, icon: <Sliders className="h-3.5 w-3.5" /> },
            { id: 'headers',    label: `Headers (${headers.filter(h=>h.enabled).length})`, icon: <Code className="h-3.5 w-3.5" /> },
            { id: 'auth',       label: 'Auth',          icon: <Key className="h-3.5 w-3.5" /> },
            { id: 'assertions', label: `AI Assertions (${customAssertions.length})`, icon: <ShieldCheck className="h-3.5 w-3.5 text-amber-400" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRequestTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeRequestTab === tab.id
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── BODY TAB ──────────────────────────────────────────────────────── */}
        {activeRequestTab === 'body' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] font-semibold">JSON Payload (raw)</span>
              <button type="button" onClick={handleBeautifyJson} className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-bold hover:bg-indigo-900 transition-all">
                ✨ Beautify JSON
              </button>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-slate-800 bg-[#090d16] p-3 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed resize-y"
            />
          </div>
        )}

        {/* ── PARAMS TAB ────────────────────────────────────────────────────── */}
        {activeRequestTab === 'params' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono font-semibold">Query Parameters</span>
              <button type="button" onClick={() => setParams([...params, { id: String(Date.now()), enabled: true, key: '', value: '' }])} className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Parameter
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="w-8 py-2 px-2 text-slate-500 font-mono text-[10px] text-left"></th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">KEY</th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">VALUE</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-900/30">
                      <td className="px-2 py-1.5 text-center">
                        <input type="checkbox" checked={p.enabled} onChange={(e) => { const u = [...params]; u[idx].enabled = e.target.checked; setParams(u); }} className="rounded" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" value={p.key} placeholder="key" onChange={(e) => { const u=[...params]; u[idx].key=e.target.value; setParams(u); }} className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700" />
                      </td>
                      <td className="px-2 py-1">
                        {p.value.includes('{{') ? (
                          <div className="flex items-center gap-1">
                            <EnvString value={p.value} envVariables={envVariables} />
                            <input type="text" value={p.value} onChange={(e) => { const u=[...params]; u[idx].value=e.target.value; setParams(u); }} className="w-0 opacity-0 absolute" />
                          </div>
                        ) : (
                          <input type="text" value={p.value} placeholder="value" onChange={(e) => { const u=[...params]; u[idx].value=e.target.value; setParams(u); }} className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700" />
                        )}
                      </td>
                      <td className="px-2">
                        <button type="button" onClick={() => setParams(params.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HEADERS TAB ───────────────────────────────────────────────────── */}
        {activeRequestTab === 'headers' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono font-semibold">HTTP Headers</span>
              <button type="button" onClick={() => setHeaders([...headers, { id: String(Date.now()), enabled: true, key: '', value: '' }])} className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Header
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="w-8 py-2 px-2"></th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">KEY</th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">VALUE</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, idx) => (
                    <tr key={h.id} className="border-b border-slate-800/60 hover:bg-slate-900/30">
                      <td className="px-2 py-1.5 text-center">
                        <input type="checkbox" checked={h.enabled} onChange={(e) => { const u=[...headers]; u[idx].enabled=e.target.checked; setHeaders(u); }} className="rounded" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" value={h.key} placeholder="Header-Key" onChange={(e) => { const u=[...headers]; u[idx].key=e.target.value; setHeaders(u); }} className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700" />
                      </td>
                      <td className="px-2 py-1">
                        {h.value.includes('{{') ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <EnvString value={h.value} envVariables={envVariables} />
                          </div>
                        ) : (
                          <input type="text" value={h.value} placeholder="value" onChange={(e) => { const u=[...headers]; u[idx].value=e.target.value; setHeaders(u); }} className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700" />
                        )}
                      </td>
                      <td className="px-2">
                        <button type="button" onClick={() => setHeaders(headers.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUTH TAB ──────────────────────────────────────────────────────── */}
        {activeRequestTab === 'auth' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-mono text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Authorization Type</label>
              <div className="flex gap-2">
                {(['bearer','apikey','none'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setAuthType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${authType === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}>
                    {t === 'bearer' ? '🔑 Bearer Token' : t === 'apikey' ? '🗝️ API Key' : '🚫 No Auth'}
                  </button>
                ))}
              </div>
            </div>
            {authType !== 'none' && (
              <div className="space-y-1.5 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <label className="block text-[11px] text-slate-400 font-mono font-semibold">
                  {authType === 'bearer' ? 'Bearer Token' : 'API Key Value'}
                </label>
                {authToken.includes('{{') ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2">
                    <EnvString value={authToken} envVariables={envVariables} />
                    <button type="button" onClick={() => setAuthToken('')} className="text-[10px] text-slate-600 hover:text-red-400 ml-auto">clear</button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder={authType === 'bearer' ? '{{bearer_token_secret}} or paste token' : '{{api_key}} or paste key'}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                )}
                <p className="text-[10px] text-slate-600">Use <span className="text-indigo-400 font-mono">{'{{variable_name}}'}</span> to reference environment variables.</p>
              </div>
            )}
          </div>
        )}

        {/* ── AI ASSERTIONS TAB ─────────────────────────────────────────────── */}
        {activeRequestTab === 'assertions' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-slate-300">AI-Generated Assertions</span>
                {assertionsModified && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold">Modified</span>
                )}
                {testSuite?.userCustomized && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 font-bold flex items-center gap-1">
                    <Edit3 className="h-2.5 w-2.5" /> User Customized
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setCustomAssertions([...customAssertions, { id: String(Date.now()), description: '', type: 'status', expectedValue: '200' }]); setAssertionsModified(true); }}
                className="flex items-center gap-1 text-indigo-400 font-bold hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Assertion
              </button>
            </div>

            <div className="space-y-2">
              {customAssertions.map((a, idx) => (
                <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2">
                    <select
                      value={a.type}
                      onChange={(e) => { const u=[...customAssertions]; u[idx].type=e.target.value as any; setCustomAssertions(u); setAssertionsModified(true); }}
                      className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-300"
                    >
                      <option value="status">Status Code</option>
                      <option value="body">Body Contains</option>
                      <option value="header">Header Value</option>
                      <option value="custom">Custom</option>
                    </select>
                    <input
                      type="text"
                      value={a.description}
                      placeholder="Assertion description..."
                      onChange={(e) => { const u=[...customAssertions]; u[idx].description=e.target.value; setCustomAssertions(u); setAssertionsModified(true); }}
                      className="flex-1 bg-transparent font-mono text-slate-300 focus:outline-none placeholder:text-slate-700 text-xs"
                    />
                    <button type="button" onClick={() => { setCustomAssertions(customAssertions.filter((_,i)=>i!==idx)); setAssertionsModified(true); }} className="text-slate-700 hover:text-red-400 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-slate-600 text-[10px] font-mono uppercase">Expected:</span>
                    <input
                      type="text"
                      value={a.expectedValue}
                      placeholder={a.type === 'status' ? '200' : a.type === 'header' ? 'application/json' : 'text to match'}
                      onChange={(e) => { const u=[...customAssertions]; u[idx].expectedValue=e.target.value; setCustomAssertions(u); setAssertionsModified(true); }}
                      className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-mono text-slate-300 focus:border-indigo-500 focus:outline-none"
                    />
                    {a.type === 'header' && (
                      <input
                        type="text"
                        value={a.jsonPath || ''}
                        placeholder="header name (e.g. content-type)"
                        onChange={(e) => { const u=[...customAssertions]; u[idx].jsonPath=e.target.value; setCustomAssertions(u); setAssertionsModified(true); }}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2 py-1 text-[11px] font-mono text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Assertion results after run */}
            {singleResult?.assertionResults?.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/60 px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">Assertion Results</div>
                {singleResult.assertionResults.map((ar: any) => (
                  <div key={ar.id} className="flex items-center gap-3 px-3 py-2 border-b border-slate-800/60 last:border-0 text-xs">
                    {ar.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    <span className="flex-1 text-slate-300 font-mono">{ar.description}</span>
                    <span className={`text-[10px] font-bold ${ar.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>{ar.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESPONSE SECTION ──────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300">Response</h3>
            {singleResult && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className={`px-2.5 py-1 rounded-lg font-extrabold border ${
                  singleResult.statusCode >= 200 && singleResult.statusCode < 300
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : singleResult.statusCode === 0
                    ? 'bg-slate-900 text-slate-500 border-slate-800'
                    : 'bg-red-950 text-red-300 border-red-800'
                }`}>
                  {singleResult.statusCode || 'ERR'}&nbsp;
                  {singleResult.statusCode >= 200 && singleResult.statusCode < 300 ? 'OK'
                    : singleResult.statusCode >= 400 ? 'Error'
                    : singleResult.statusCode > 0 ? 'Redirect'
                    : 'Failed'}
                </span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {singleResult.responseTimeMs} ms
                </span>
                <span className="text-slate-500">
                  {singleResult.responseBody?.length || 0} chars
                </span>
              </div>
            )}
          </div>

          {singleResult ? (
            <div className="rounded-2xl border border-slate-800 bg-[#060a12] overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 px-4 py-2 border-b border-slate-800/80 bg-slate-900/40">
                <span className="font-mono">Response Body</span>
                <button type="button" onClick={handleCopyResponse} className="text-indigo-400 hover:underline flex items-center gap-1 font-mono text-[11px]">
                  {copiedResponse ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedResponse ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-4 leading-relaxed whitespace-pre-wrap max-h-80 custom-scrollbar overflow-y-auto">
                {singleResult.responseBody || '(empty response body)'}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-slate-800/80 bg-slate-900/30 text-slate-600 text-xs font-mono">
              Hit <strong className="text-indigo-400">⚡ Send Request</strong> to execute and inspect live HTTP response.
            </div>
          )}
        </div>

      </div>

      {/* ── FLOATING TOP FAB ────────────────────────────────────────────────── */}
      {showTopFAB && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="absolute bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all border border-indigo-400/60 animate-in fade-in zoom-in duration-200"
          title="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── SAVE ASSERTIONS DIALOG ──────────────────────────────────────────── */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-3xl">
          <div className="w-80 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-950/60 border border-amber-800 mx-auto">
              <Save className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="font-bold text-sm text-white">Save Custom Assertions?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You've modified the AI assertions for <span className="text-indigo-300 font-semibold">{endpointNode.name}</span>. Save them as user-customized?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAssertions}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2 text-xs font-extrabold text-white hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                ✅ Save & Close
              </button>
              <button
                type="button"
                onClick={() => { setShowSaveDialog(false); setSelectedEndpointIdForDetail(null); }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
              >
                Discard
              </button>
            </div>
            <button type="button" onClick={() => setShowSaveDialog(false)} className="text-[11px] text-slate-600 hover:text-slate-400">Cancel (keep editing)</button>
          </div>
        </div>
      )}

    </div>
  );
};
