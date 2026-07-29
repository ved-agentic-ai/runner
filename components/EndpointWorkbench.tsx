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
  Save,
  RotateCcw,
  X,
  Info
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

// ─── Value Input with Variable Hover Tooltip & Inline Reveal 👁️ Button ────────
const ValueInputWithVariableHover: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  envVariables: Record<string, string>;
  className?: string;
  tooltipPosition?: 'top' | 'bottom';
  hideInlineReveal?: boolean;
}> = ({ value, onChange, placeholder, envVariables, className, tooltipPosition = 'bottom', hideInlineReveal = false }) => {
  const [showInlineResolved, setShowInlineResolved] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasVar = Boolean(value && value.includes('{{'));
  const matches = hasVar ? Array.from(value.matchAll(/\{\{([^}]+)\}\}/g)) : [];

  let resolved = value;
  let isSecret = false;
  if (hasVar) {
    matches.forEach(m => {
      const k = m[1].trim();
      if (/token|secret|key|password|pwd|auth|bearer|apikey/i.test(k)) isSecret = true;
      resolved = resolved.replace(m[0], envVariables[k] !== undefined ? envVariables[k] : m[0]);
    });
  }

  return (
    <div className="relative flex flex-col gap-1 w-full overflow-visible" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={className || "flex-1 bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700 text-xs py-1"}
        />

        {hasVar && !hideInlineReveal && (
          <button
            type="button"
            onClick={() => setShowInlineResolved(!showInlineResolved)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/80 text-amber-300 hover:bg-amber-900/80 text-[11px] font-bold transition-all shadow-sm shrink-0"
            title={showInlineResolved ? "Hide resolved value" : "Reveal resolved value inline"}
          >
            {showInlineResolved ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-amber-400" />}
            <span>{showInlineResolved ? 'Hide' : 'Reveal'}</span>
          </button>
        )}
      </div>

      {/* Inline Revealed Value */}
      {hasVar && showInlineResolved && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-indigo-900/60 text-[10px] font-mono animate-in fade-in duration-150">
          <span className="text-slate-400 font-semibold shrink-0">Resolved:</span>
          <span className={`break-all font-bold ${isSecret ? 'text-amber-400' : 'text-emerald-400'}`}>
            {resolved}
          </span>
        </div>
      )}

      {/* Theme Matching Mouse Hover Tooltip Card (Safe position: no overflow cutting) */}
      {hasVar && hovered && !showInlineResolved && (
        <div className={`absolute left-0 ${
          tooltipPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
        } z-[99999] p-3 rounded-xl border border-indigo-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl space-y-2 font-mono text-[11px] min-w-[280px] max-w-md pointer-events-none animate-in fade-in zoom-in-95 duration-150`}>
          <div className="flex items-center gap-1.5 font-bold text-indigo-300 pb-1.5 border-b border-slate-800/80 text-[10px]">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Variable Resolution
          </div>
          <div className="space-y-1.5">
            {matches.map((m, i) => {
              const k = m[1].trim();
              const val = envVariables[k];
              const sec = /token|secret|key|password|pwd|auth|bearer|apikey/i.test(k);
              return (
                <div key={i} className="flex justify-between items-start gap-3">
                  <span className="text-indigo-300 font-bold shrink-0">{`{{${k}}}`}</span>
                  <span className={`break-all font-semibold text-right ${sec ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {val !== undefined ? (sec ? '•••••••••• (secret)' : val) : 'NOT SET'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Environment Variables Quick Reference Table ─────────────────────────────
const EnvVarsQuickRef: React.FC<{ envVariables: Record<string, string> }> = ({ envVariables }) => {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);

  const keys = Object.keys(envVariables);
  if (keys.length === 0) return null;

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg transition-all">
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-300">
          <Info className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>Active Environment Variables ({keys.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Click to {expanded ? 'collapse' : 'expand table'}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-bold text-indigo-400">Variable Key</th>
                <th className="py-2.5 px-4 font-bold text-slate-300">Resolved Value</th>
                <th className="py-2.5 px-4 font-bold text-right w-36">Type / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {keys.map((k) => {
                const val = envVariables[k];
                const isSecret = /token|secret|key|password|pwd|auth|bearer|apikey/i.test(k);
                const isPlain = showSecrets[k];
                const displayVal = isSecret && !isPlain ? '••••••••••••••••' : (val || '(empty)');

                return (
                  <tr key={k} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-4 text-indigo-300 font-bold font-mono whitespace-nowrap">
                      {`{{${k}}}`}
                    </td>
                    <td className="py-2.5 px-4 break-all text-emerald-400 font-mono font-medium select-all">
                      {displayVal}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {isSecret ? (
                        <button
                          type="button"
                          onClick={() => toggleSecret(k)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/80 text-amber-300 hover:bg-amber-900/80 text-[11px] font-bold transition-all shadow-sm"
                        >
                          {isPlain ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-amber-400" />}
                          <span>{isPlain ? 'Hide' : 'Reveal'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold shadow-sm">
                          <Code className="h-3.5 w-3.5 text-slate-400" />
                          <span>Plain Text</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main Endpoint Workbench ──────────────────────────────────────────────────
export const EndpointWorkbench: React.FC = () => {
  const {
    selectedEndpointIdForDetail,
    setSelectedEndpointIdForDetail,
    flatEndpointMap,
    serverFlatEndpointMap,
    generatedTestSuites,
    envVariables,
    updateEndpointName
  } = useRunnerStore();

  const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'params' | 'headers' | 'auth' | 'assertions'>('body');
  const [running, setRunning] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const workbenchScrollRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const serverOutputScrollRef = useRef<HTMLPreElement>(null);
  const [showTopFAB, setShowTopFAB] = useState(false);
  const [showServerOutputTopFab, setShowServerOutputTopFab] = useState(false);
  const [showResolvedUrl, setShowResolvedUrl] = useState(false);

  // Collapsible Panel States
  const [responsePayloadCollapsed, setResponsePayloadCollapsed] = useState(false);
  const [bodyPanelCollapsed, setBodyPanelCollapsed] = useState(false);
  const [assertionEvalCollapsed, setAssertionEvalCollapsed] = useState(false);
  const [serverOutputCollapsed, setServerOutputCollapsed] = useState(false);

  // Editable Endpoint Name
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState('');

  // Single-run isolated result
  const [singleResult, setSingleResult] = useState<any>(null);

  // AI Assertions (editable + collapsible)
  const [customAssertions, setCustomAssertions] = useState<AssertionItem[]>([]);
  const [assertionsModified, setAssertionsModified] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [assertionsCollapsed, setAssertionsCollapsed] = useState(false);

  // Safe node lookup
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

  // Form State
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

  // Bi-directional sync: Params -> URL
  const updateParamsAndUrl = (nextParams: ParamItem[]) => {
    setParams(nextParams);
    try {
      const baseUrl = (url || '').split('?')[0];
      const active = nextParams.filter(p => p.enabled && p.key.trim());
      if (active.length === 0) {
        setUrl(baseUrl);
      } else {
        const qs = active.map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`).join('&');
        setUrl(`${baseUrl}?${qs}`);
      }
    } catch (_) {}
  };

  // Bi-directional sync: URL -> Params
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    try {
      if (newUrl.includes('?')) {
        const qStr = newUrl.split('?')[1] || '';
        const pairs = qStr.split('&').filter(Boolean);
        const parsed: ParamItem[] = pairs.map((pair: string, idx: number) => {
          const [k, v] = pair.split('=');
          return {
            id: `p_${idx}`,
            enabled: true,
            key: decodeURIComponent(k || ''),
            value: decodeURIComponent(v || ''),
          };
        });
        if (parsed.length > 0) {
          setParams(parsed);
        }
      }
    } catch (_) {}
  };

  // Computed Resolved URL for clean display
  const resolvedUrlPreview = useMemo(() => {
    if (!url) return '';
    let res = url;
    Object.entries(envVariables).forEach(([k, v]) => {
      res = res.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
    });
    return res;
  }, [url, envVariables]);

  // Reset form when selected endpoint changes
  const initFromNode = useCallback(() => {
    if (!endpointNode) return;

    setMethod(endpointNode.method || 'GET');
    const initialUrl = endpointNode.url || `https://api.internal-service.com/v1/${endpointNode.name}`;
    setUrl(initialUrl);
    setCustomName(endpointNode.name);
    setEditingName(false);
    setSingleResult(null);
    setAssertionsModified(false);

    if (initialUrl.includes('?')) {
      const qStr = initialUrl.split('?')[1] || '';
      const pairs = qStr.split('&').filter(Boolean);
      const parsed: ParamItem[] = pairs.map((pair: string, idx: number) => {
        const [k, v] = pair.split('=');
        return { id: `p_${idx}`, enabled: true, key: decodeURIComponent(k || ''), value: decodeURIComponent(v || '') };
      });
      if (parsed.length > 0) setParams(parsed);
    } else {
      setParams([{ id: '1', enabled: true, key: 'mockData', value: 'true' }]);
    }

    if (endpointNode.request?.body?.raw) {
      setBodyText(endpointNode.request.body.raw);
    } else {
      setBodyText('{\n  "businessId": "5561234567",\n  "countryCode": "FI"\n}');
    }

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
    } else {
      setHeaders([
        { id: 'h1', enabled: true, key: 'Content-Type', value: 'application/json' },
        { id: 'h2', enabled: true, key: 'app-key', value: '{{internal-service-app-key}}' },
        { id: 'h3', enabled: true, key: 'Accept', value: 'application/json' },
      ]);
    }

    if (testSuite?.testCases?.length) {
      setCustomAssertions(testSuite.testCases.map((tc: any) => ({
        id: tc.id,
        description: tc.description || '',
        type: (tc.type || tc.assertionType || 'status') as any,
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
  }, [selectedEndpointIdForDetail, endpointNode, testSuite]);

  useEffect(() => {
    initFromNode();
  }, [initFromNode]);

  // Scroll FAB
  const handleWorkbenchScroll = useCallback(() => {
    setShowTopFAB((workbenchScrollRef.current?.scrollTop || 0) > 80);
  }, []);

  const handleScrollToTop = () => workbenchScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const handleBeautifyJson = () => {
    try { setBodyText(JSON.stringify(JSON.parse(bodyText), null, 2)); } catch (_) {}
  };

  // Name Editing Save
  const handleSaveName = () => {
    if (customName.trim() && selectedEndpointIdForDetail && customName !== endpointNode?.name) {
      updateEndpointName(selectedEndpointIdForDetail, customName.trim());
    }
    setEditingName(false);
  };

  // Close Handler with Save Prompt
  const handleClose = () => {
    if (assertionsModified) {
      setShowSaveDialog(true);
    } else {
      setSelectedEndpointIdForDetail(null);
    }
  };

  const handleSaveAssertions = () => {
    if (selectedEndpointIdForDetail && endpointNode) {
      const existing = useRunnerStore.getState().generatedTestSuites[selectedEndpointIdForDetail];
      const updated: EndpointTestSuite = {
        endpointId: selectedEndpointIdForDetail,
        endpointName: customName || endpointNode.name,
        method: (method || endpointNode.method || 'GET') as HttpMethod,
        url: url || endpointNode.url || '',
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

  // Execute Request (Single Run Isolated)
  const handleSendSingle = async () => {
    if (!selectedEndpointIdForDetail || !endpointNode) return;
    setRunning(true);
    const startMs = Date.now();
    setSingleResult(null);

    try {
      const env = useRunnerStore.getState().envVariables;
      const resolveVars = (s: string) =>
        Object.entries(env).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v), s);

      let resolvedUrl = resolveVars(url || endpointNode.url || '');
      const enabledParams = params.filter((p) => p.enabled && p.key.trim());
      if (enabledParams.length > 0 && !resolvedUrl.includes('?')) {
        const qs = enabledParams.map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(resolveVars(p.value))}`).join('&');
        resolvedUrl = `${resolvedUrl}?${qs}`;
      }

      const activeHeaders: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
        activeHeaders[h.key.trim()] = resolveVars(h.value);
      });

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

      const httpStatus = data.statusCode ?? res.status ?? 200;
      const isSuccess = httpStatus >= 200 && httpStatus < 300;

      let responseBodyText = data.responseBody ?? data.error ?? '';
      if (typeof responseBodyText === 'object') {
        responseBodyText = JSON.stringify(responseBodyText, null, 2);
      }
      let formattedBody = responseBodyText;
      try {
        if (responseBodyText && (responseBodyText.trim().startsWith('{') || responseBodyText.trim().startsWith('['))) {
          formattedBody = JSON.stringify(JSON.parse(responseBodyText), null, 2);
        }
      } catch (_) {}

      const assertionResults = customAssertions.map((a) => {
        let pass = false;
        if (a.type === 'status') {
          pass = String(httpStatus) === String(a.expectedValue);
        } else if (a.type === 'body') {
          pass = a.expectedValue ? formattedBody.includes(a.expectedValue) : formattedBody.length > 0;
        } else if (a.type === 'header') {
          const headerVal = (data.responseHeaders || {})[a.jsonPath || ''] || '';
          pass = a.expectedValue ? headerVal.toLowerCase().includes(a.expectedValue.toLowerCase()) : !!headerVal;
        } else {
          pass = isSuccess;
        }
        return {
          id: a.id,
          description: a.description,
          status: pass ? ('pass' as const) : ('fail' as const),
          expected: a.expectedValue,
          actual: a.type === 'status' ? String(httpStatus) : ''
        };
      });

      setSingleResult({
        statusCode: httpStatus,
        statusText: data.statusText || (isSuccess ? 'OK' : 'Error'),
        status: isSuccess ? 'passed' : 'failed',
        responseTimeMs: data.responseTimeMs || (endMs - startMs),
        responseHeaders: data.responseHeaders || {},
        responseBody: formattedBody || '(Empty response body)',
        requestHeaders: activeHeaders,
        requestBody: resolvedBody,
        resolvedUrl,
        assertionResults,
        executedAt: new Date().toISOString(),
      });

    } catch (err: any) {
      setSingleResult({
        statusCode: 0,
        statusText: 'Network Error',
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

    // Smooth Scroll to Response Section
    setTimeout(() => {
      responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
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

  // Empty State
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
              <Send className="h-8 w-8 text-indigo-400 stroke-1.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-200">No Endpoint Selected</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Click any endpoint in the <span className="text-indigo-400 font-semibold">Collection Hierarchy</span> or <span className="text-indigo-400 font-semibold">Server Explorer</span> to open it in the interactive workbench.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[750px] max-h-[82vh] overflow-hidden text-left font-sans relative">

      {/* ── WORKBENCH TOP BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        
        {/* Endpoint Name with Inline Editing */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${methodColors[method] || methodColors.GET}`}>
            {method}
          </span>

          {editingName ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="flex-1 rounded-lg border border-indigo-500 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 group cursor-pointer" onClick={() => setEditingName(true)}>
              <h2 className="font-extrabold text-sm text-white truncate max-w-xs sm:max-w-md hover:text-indigo-300 transition-colors">
                {endpointNode.name}
              </h2>
              <button
                type="button"
                className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-indigo-300 p-1"
                title="Edit endpoint name (syncs to Collection Hierarchy)"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {testSuite?.userCustomized && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              <Edit3 className="h-2.5 w-2.5" /> User Customized
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={initFromNode}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
            title="Refresh & reset endpoint form to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-400" />
            <span>Refresh</span>
          </button>

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

      {/* ── CLEAN URL BAR WITH BI-DIRECTIONAL PARAMS SYNC ─────────────────────── */}
      <div className="p-3 bg-slate-950 border-b border-slate-900 space-y-2 shrink-0">
        <div className="flex items-center space-x-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <ValueInputWithVariableHover
            value={url}
            onChange={handleUrlChange}
            placeholder="https://api.example.com/v1/resource"
            envVariables={envVariables}
            tooltipPosition="bottom"
            hideInlineReveal={true}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none cursor-text"
          />
        </div>

        {/* Masked/Unmasked Resolved URL Display */}
        {url && url.includes('{{') && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-indigo-900/40 bg-indigo-950/30 text-[11px] font-mono">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-slate-400 font-semibold shrink-0">Resolved URL:</span>
              <span className="font-semibold break-all text-emerald-400 select-all">
                {showResolvedUrl ? resolvedUrlPreview : '••••••••••••••••••••••••••••••••••••••••'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowResolvedUrl(!showResolvedUrl)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/80 text-amber-300 hover:bg-amber-900/80 text-[11px] font-bold shrink-0 transition-colors shadow-sm"
              title={showResolvedUrl ? "Hide resolved URL" : "Show unmasked resolved URL"}
            >
              {showResolvedUrl ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5 text-amber-400" />}
              <span>{showResolvedUrl ? 'Hide' : 'Reveal URL'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── WORKBENCH SCROLLABLE BODY ───────────────────────────────────────── */}
      <div
        ref={workbenchScrollRef}
        onScroll={handleWorkbenchScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
      >

        {/* Environment Variables Quick Reference Table */}
        <EnvVarsQuickRef envVariables={envVariables} />

        {/* REQUEST TAB SELECTION BAR */}
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

        {/* ── BODY TAB (COLLAPSIBLE) ────────────────────────────────────────── */}
        {activeRequestTab === 'body' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setBodyPanelCollapsed(!bodyPanelCollapsed)}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${bodyPanelCollapsed ? '-rotate-90' : ''}`} />
                <span>JSON Payload (raw)</span>
              </button>
              <button type="button" onClick={handleBeautifyJson} className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-bold hover:bg-indigo-900 transition-all">
                ✨ Beautify JSON
              </button>
            </div>
            {!bodyPanelCollapsed && (
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={8}
                className="w-full rounded-2xl border border-slate-800 bg-[#090d16] p-3 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed resize-y animate-in fade-in duration-150"
              />
            )}
          </div>
        )}

        {/* ── PARAMS TAB (OVERFLOW VISIBLE + LIVE URL SYNC) ───────────────────── */}
        {activeRequestTab === 'params' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono font-semibold">Query Parameters</span>
              <button 
                type="button" 
                onClick={() => updateParamsAndUrl([...params, { id: String(Date.now()), enabled: true, key: '', value: '' }])} 
                className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Parameter
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 overflow-visible relative">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="w-8 py-2 px-2 text-slate-500 font-mono text-[10px] text-left"></th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">KEY</th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">VALUE (Hover / Reveal 👁️)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-900/30">
                      <td className="px-2 py-1.5 text-center">
                        <input type="checkbox" checked={p.enabled} onChange={(e) => { const u = [...params]; u[idx].enabled = e.target.checked; updateParamsAndUrl(u); }} className="rounded" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" value={p.key} placeholder="key" onChange={(e) => { const u=[...params]; u[idx].key=e.target.value; updateParamsAndUrl(u); }} className="w-full bg-transparent font-mono text-slate-200 focus:outline-none placeholder:text-slate-700" />
                      </td>
                      <td className="px-2 py-1 relative">
                        <ValueInputWithVariableHover
                          value={p.value}
                          onChange={(val) => { const u=[...params]; u[idx].value=val; updateParamsAndUrl(u); }}
                          placeholder="value"
                          envVariables={envVariables}
                          tooltipPosition="bottom"
                        />
                      </td>
                      <td className="px-2">
                        <button type="button" onClick={() => updateParamsAndUrl(params.filter((_, i) => i !== idx))} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="h-3 w-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HEADERS TAB (OVERFLOW VISIBLE FOR UNCLIPPED HOVER TOOLTIPS) ─────── */}
        {activeRequestTab === 'headers' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono font-semibold">HTTP Headers</span>
              <button type="button" onClick={() => setHeaders([...headers, { id: String(Date.now()), enabled: true, key: '', value: '' }])} className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Header
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 overflow-visible relative">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800">
                  <tr>
                    <th className="w-8 py-2 px-2"></th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">KEY</th>
                    <th className="py-2 px-3 text-slate-500 font-mono text-[10px] text-left">VALUE (Hover / Reveal 👁️)</th>
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
                      <td className="px-2 py-1 relative">
                        <ValueInputWithVariableHover
                          value={h.value}
                          onChange={(val) => { const u=[...headers]; u[idx].value=val; setHeaders(u); }}
                          placeholder="value"
                          envVariables={envVariables}
                          tooltipPosition="bottom"
                        />
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
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <label className="block text-[11px] text-slate-400 font-mono font-semibold">
                  {authType === 'bearer' ? 'Bearer Token' : 'API Key Value'}
                </label>
                <ValueInputWithVariableHover
                  value={authToken}
                  onChange={setAuthToken}
                  placeholder={authType === 'bearer' ? '{{bearer_token_secret}} or paste token' : '{{api_key}} or paste key'}
                  envVariables={envVariables}
                  tooltipPosition="bottom"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none cursor-text"
                />
                <p className="text-[10px] text-slate-600">Use <span className="text-indigo-400 font-mono">{'{{variable_name}}'}</span> to reference environment variables. Click <span className="text-indigo-400 font-bold">Reveal 👁️</span> or hover to inspect resolution.</p>
              </div>
            )}
          </div>
        )}

        {/* ── AI ASSERTIONS TAB (COLLAPSIBLE) ────────────────────────────────── */}
        {activeRequestTab === 'assertions' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setAssertionsCollapsed(!assertionsCollapsed)}
                className="flex items-center gap-2 text-left hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${assertionsCollapsed ? '-rotate-90' : ''}`} />
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="font-semibold text-slate-200">AI-Generated Test Assertions</span>
                {assertionsModified && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-bold">Modified</span>
                )}
                {testSuite?.userCustomized && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 font-bold flex items-center gap-1">
                    <Edit3 className="h-2.5 w-2.5" /> User Customized
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomAssertions([...customAssertions, { id: String(Date.now()), description: '', type: 'status', expectedValue: '200' }]);
                  setAssertionsModified(true);
                  setAssertionsCollapsed(false);
                }}
                className="flex items-center gap-1 text-indigo-400 font-bold hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Assertion
              </button>
            </div>

            {!assertionsCollapsed && (
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
            )}
          </div>
        )}

        {/* ── RESPONSE SECTION (COLLAPSIBLE) ──────────────────────────────────── */}
        <div ref={responseRef} className="pt-4 border-t border-slate-800 space-y-3">
          <div 
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setResponsePayloadCollapsed(!responsePayloadCollapsed)}
          >
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${responsePayloadCollapsed ? '-rotate-90' : ''}`} />
              <span>Response Payload</span>
              {singleResult && (
                <span className="text-[11px] font-normal text-slate-500">
                  (Live HTTP Execution)
                </span>
              )}
            </h3>

            {singleResult && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className={`px-2.5 py-1 rounded-lg font-extrabold border ${
                  singleResult.statusCode >= 200 && singleResult.statusCode < 300
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : singleResult.statusCode === 0
                    ? 'bg-slate-900 text-slate-500 border-slate-800'
                    : 'bg-red-950 text-red-300 border-red-800'
                }`}>
                  {singleResult.statusCode || 200}&nbsp;{singleResult.statusText || 'OK'}
                </span>

                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {singleResult.responseTimeMs} ms
                </span>
              </div>
            )}
          </div>

          {!responsePayloadCollapsed && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Assertion Results Bar if executed (Collapsible) */}
              {singleResult?.assertionResults?.length > 0 && (
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/90">
                  <div 
                    onClick={() => setAssertionEvalCollapsed(!assertionEvalCollapsed)}
                    className="bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between cursor-pointer hover:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${assertionEvalCollapsed ? '-rotate-90' : ''}`} />
                      <span>Assertion Evaluation ({singleResult.assertionResults.filter((r: any) => r.status === 'pass').length}/{singleResult.assertionResults.length} Passed)</span>
                    </div>
                  </div>
                  {!assertionEvalCollapsed && (
                    <div className="divide-y divide-slate-800/60 animate-in fade-in duration-150">
                      {singleResult.assertionResults.map((ar: any) => (
                        <div key={ar.id} className="flex items-center gap-3 px-3 py-1.5 text-xs">
                          {ar.status === 'pass' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                          <span className="flex-1 text-slate-300 font-mono text-[11px]">{ar.description}</span>
                          <span className={`text-[10px] font-bold uppercase ${ar.status === 'pass' ? 'text-emerald-400' : 'text-red-400'}`}>{ar.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Response Body Block (Collapsible + Floating Top FAB) */}
              {singleResult ? (
                <div className="rounded-2xl border border-slate-800 bg-[#060a12] overflow-hidden relative">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-4 py-2 border-b border-slate-800/80 bg-slate-900/40">
                    <button
                      type="button"
                      onClick={() => setServerOutputCollapsed(!serverOutputCollapsed)}
                      className="flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:text-white transition-colors"
                    >
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${serverOutputCollapsed ? '-rotate-90' : ''}`} />
                      <span>Server Output ({singleResult.responseBody?.length || 0} characters)</span>
                    </button>
                    <button type="button" onClick={handleCopyResponse} className="text-indigo-400 hover:underline flex items-center gap-1 font-mono text-[11px]">
                      {copiedResponse ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedResponse ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {!serverOutputCollapsed && (
                    <div className="relative">
                      <pre 
                        ref={serverOutputScrollRef}
                        onScroll={(e) => setShowServerOutputTopFab(e.currentTarget.scrollTop > 60)}
                        className="text-xs font-mono text-emerald-300 overflow-x-auto p-4 leading-relaxed whitespace-pre-wrap max-h-96 custom-scrollbar overflow-y-auto"
                      >
                        {singleResult.responseBody}
                      </pre>
                      
                      {/* Floating Top FAB for Server Output */}
                      {showServerOutputTopFab && (
                        <button
                          type="button"
                          onClick={() => serverOutputScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="absolute bottom-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-xl hover:bg-indigo-500 transition-all border border-indigo-400/50"
                          title="Scroll server output to top"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-slate-800/80 bg-slate-900/30 text-slate-600 text-xs font-mono">
                  Hit <strong className="text-indigo-400">⚡ Send Request</strong> above to execute and inspect live HTTP response payload.
                </div>
              )}
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
