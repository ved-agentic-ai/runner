'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Info,
  Folder,
  Target,
  ArrowLeft,
  ArrowRight,
  Square,
  ListTree
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { HttpMethod, EndpointTestSuite, TreeNode } from '@/lib/types';
import { InteractiveJsonViewer } from './InteractiveJsonViewer';

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

      {/* Theme Matching Mouse Hover Tooltip Card */}
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
    workbenchOpenTabIds,
    workbenchActiveTabId,
    openWorkbenchTab,
    closeWorkbenchTab,
    closeAllWorkbenchTabs,
    closeOtherWorkbenchTabs,
    closeWorkbenchTabsToLeft,
    closeWorkbenchTabsToRight,
    flatEndpointMap,
    serverFlatEndpointMap,
    generatedTestSuites,
    executionResults,
    setSingleExecutionResult,
    addTabHistory,
    envVariables,
    updateEndpointName,
    rootNodes,
    serverRootNodes,
    activeWorkspaceSource
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

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({ isOpen: false, x: 0, y: 0, tabId: '' });

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  }, []);

  // Collapsible Panel States
  const [responsePayloadCollapsed, setResponsePayloadCollapsed] = useState(false);
  const [bodyPanelCollapsed, setBodyPanelCollapsed] = useState(false);
  const [paramsPanelCollapsed, setParamsPanelCollapsed] = useState(false);
  const [headersPanelCollapsed, setHeadersPanelCollapsed] = useState(false);
  const [authPanelCollapsed, setAuthPanelCollapsed] = useState(false);
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
  const [showTabMenu, setShowTabMenu] = useState(false);
  const [showInteractiveBodyViewer, setShowInteractiveBodyViewer] = useState(false);

  // Sync singleResult with persistent executionResults store and expand output
  useEffect(() => {
    if (selectedEndpointIdForDetail && executionResults[selectedEndpointIdForDetail]) {
      setSingleResult(executionResults[selectedEndpointIdForDetail]);
      setResponsePayloadCollapsed(false);
      setServerOutputCollapsed(false);
    } else {
      setSingleResult(null);
    }
  }, [selectedEndpointIdForDetail, executionResults]);

  // Active collection tree nodes for breadcrumbs
  const activeNodes = (activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0) 
    ? serverRootNodes 
    : rootNodes;

  // Breadcrumb Path Computation for Animated Tree Navigation
  const breadcrumbPath = useMemo(() => {
    if (!selectedEndpointIdForDetail || activeNodes.length === 0) return [];
    const path: { id: string; name: string; type: string }[] = [];

    function findPath(nodes: TreeNode[], targetId: string, currentPath: { id: string; name: string; type: string }[] = []): boolean {
      for (const node of nodes) {
        const nextPath = [...currentPath, { id: node.id, name: node.name, type: node.type }];
        if (node.id === targetId) {
          path.push(...nextPath);
          return true;
        }
        if (node.children && findPath(node.children, targetId, nextPath)) {
          return true;
        }
      }
      return false;
    }

    findPath(activeNodes, selectedEndpointIdForDetail);
    return path;
  }, [selectedEndpointIdForDetail, activeNodes]);

  // Jump to Tree & Pulse Highlight Node
  const handleJumpToTree = () => {
    if (!selectedEndpointIdForDetail) return;
    const el = document.getElementById(`tree-node-${selectedEndpointIdForDetail}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-400', 'animate-pulse');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'animate-pulse');
      }, 2500);
    }
  };

  // Recursive fallback node finder
  const findNodeInTree = useCallback((nodes: TreeNode[], targetId: string): TreeNode | undefined => {
    for (const n of nodes) {
      if (n.id === targetId) return n;
      if (n.children && n.children.length > 0) {
        const found = findNodeInTree(n.children, targetId);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  // Safe node lookup helper by ID
  const getNodeById = useCallback((id: string): TreeNode | undefined => {
    if (!id) return undefined;
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

    return findNodeInTree(rootNodes, id) || findNodeInTree(serverRootNodes, id);
  }, [flatEndpointMap, serverFlatEndpointMap, rootNodes, serverRootNodes, findNodeInTree]);

  // Safe node lookup with 100% tree search fallback
  const endpointNode = useMemo(() => {
    if (!selectedEndpointIdForDetail) return undefined;
    return getNodeById(selectedEndpointIdForDetail);
  }, [selectedEndpointIdForDetail, getNodeById]);

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
    setAssertionsModified(false);

    // Retain existing execution result if already executed
    if (selectedEndpointIdForDetail && executionResults[selectedEndpointIdForDetail]) {
      setSingleResult(executionResults[selectedEndpointIdForDetail]);
    } else {
      setSingleResult(null);
    }

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
  }, [selectedEndpointIdForDetail, endpointNode, testSuite, executionResults]);

  useEffect(() => {
    initFromNode();
  }, [initFromNode]);

  // Scroll FAB
  const handleWorkbenchScroll = useCallback(() => {
    setShowTopFAB((workbenchScrollRef.current?.scrollTop || 0) > 80);
  }, []);

  const handleScrollToTop = () => workbenchScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const handleBeautifyJson = () => {
    if (!bodyText.trim()) return;
    try {
      setBodyText(JSON.stringify(JSON.parse(bodyText), null, 2));
    } catch (_) {
      try {
        const stripped = bodyText
          .replace(/("(?:\\.|[^"\\\n])*")|\/\*[\s\S]*?\*\/|\/\/.*/g, (m, g1) => (g1 ? g1 : ''))
          .replace(/,(\s*[\}\]])/g, '$1');
        setBodyText(JSON.stringify(JSON.parse(stripped), null, 2));
      } catch (_) {}
    }
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

      const resultObj = {
        statusCode: httpStatus,
        statusText: data.statusText || (isSuccess ? 'OK' : 'Error'),
        status: isSuccess ? ('passed' as const) : ('failed' as const),
        responseTimeMs: data.responseTimeMs || (endMs - startMs),
        responseHeaders: data.responseHeaders || {},
        responseBody: formattedBody || '(Empty response body)',
        requestHeaders: activeHeaders,
        requestBody: resolvedBody,
        resolvedUrl,
        assertionResults,
        executedAt: new Date().toISOString(),
      };

      setSingleResult(resultObj);
      if (selectedEndpointIdForDetail) {
        setSingleExecutionResult(selectedEndpointIdForDetail, resultObj);
        if (endpointNode) {
          addTabHistory({
            endpointId: selectedEndpointIdForDetail,
            endpointName: customName || endpointNode.name || 'Endpoint',
            method: endpointNode.method || 'GET',
            status: isSuccess ? 'passed' : 'failed',
            statusCode: httpStatus,
            responseTimeMs: data.responseTimeMs || (endMs - startMs)
          });
        }
      }

    } catch (err: any) {
      const errObj = {
        statusCode: 0,
        statusText: 'Network Error',
        status: 'failed' as const,
        responseTimeMs: Date.now() - startMs,
        responseHeaders: {},
        responseBody: `Request failed: ${err.message}`,
        requestHeaders: {},
        requestBody: bodyText,
        resolvedUrl: url,
        assertionResults: [],
        executedAt: new Date().toISOString(),
      };

      setSingleResult(errObj);
      if (selectedEndpointIdForDetail) {
        setSingleExecutionResult(selectedEndpointIdForDetail, errObj);
      }
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

  const methodColors: Record<string, string> = {
    GET:    'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    POST:   'bg-amber-950/80 text-amber-300 border-amber-800',
    PUT:    'bg-indigo-950/80 text-indigo-300 border-indigo-800',
    DELETE: 'bg-red-950/80 text-red-300 border-red-800',
    PATCH:  'bg-purple-950/80 text-purple-300 border-purple-800',
  };

  const activeMap = (activeWorkspaceSource === 'server' && serverFlatEndpointMap.size > 0) || (flatEndpointMap.size === 0 && serverFlatEndpointMap.size > 0)
    ? serverFlatEndpointMap
    : flatEndpointMap;

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
    <div id="endpoint-workbench-panel" className="w-full rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[750px] max-h-[82vh] overflow-hidden text-left font-sans relative scroll-mt-48">

      {/* ── MULTI-TAB WORKBENCH TAB BAR (FULL WIDTH WITH RIGHT-CLICK CONTEXT MENU) ── */}
      {workbenchOpenTabIds.length > 0 && (
        <div className="relative z-10 flex items-center justify-between bg-[#040711] px-3 py-1.5 border-b border-slate-800/80 shrink-0 select-none overflow-hidden">
          <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar flex-1 py-0.5">
            {workbenchOpenTabIds.map((tabId) => {
              const node = getNodeById(tabId);
              const isActive = tabId === (workbenchActiveTabId || selectedEndpointIdForDetail);
              const tabMethod = node?.method || 'GET';
              const tabName = node?.name || 'Endpoint';

              return (
                <div
                  key={tabId}
                  onClick={() => openWorkbenchTab(tabId)}
                  onContextMenu={(e) => handleTabContextMenu(e, tabId)}
                  className={`group/tab relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? 'bg-slate-900 border-indigo-500/80 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                  title="Left-click to open | Right-click for Tab Actions"
                >
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-black ${methodColors[tabMethod] || 'text-slate-400'}`}>
                    {tabMethod}
                  </span>
                  <span className="truncate max-w-[200px] sm:max-w-[280px]">{tabName}</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWorkbenchTab(tabId);
                    }}
                    className="p-0.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-950/60 transition-colors"
                    title="Close Tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SLEEK FLOATING RIGHT-CLICK TAB CONTEXT MENU (PORTAL AT BODY LEVEL) ── */}
      {contextMenu.isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop overlay to close context menu on outside click */}
          <div 
            className="fixed inset-0 z-[999998]" 
            onClick={() => setContextMenu(prev => ({ ...prev, isOpen: false }))} 
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(prev => ({ ...prev, isOpen: false }));
            }}
          />

          <div 
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 210)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 250)}px`
            }}
            className="fixed z-[999999] flex flex-col bg-[#090d16] border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 w-52 text-xs font-mono animate-in fade-in duration-150 text-slate-200 backdrop-blur-md"
          >
            <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 truncate flex items-center justify-between">
              <span className="truncate max-w-[140px]">{getNodeById(contextMenu.tabId)?.name || 'Tab Actions'}</span>
              <span className="text-[10px] text-slate-500 font-normal">Right-Click</span>
            </div>

            <button
              type="button"
              onClick={() => {
                closeWorkbenchTab(contextMenu.tabId);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer mt-1"
            >
              <X className="h-3.5 w-3.5 text-rose-400" /> Close Tab
            </button>

            <button
              type="button"
              onClick={() => {
                closeOtherWorkbenchTabs(contextMenu.tabId);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 text-purple-400" /> Close Other Tabs
            </button>

            <button
              type="button"
              onClick={() => {
                closeWorkbenchTabsToLeft(contextMenu.tabId);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" /> Close Tabs to Left
            </button>

            <button
              type="button"
              onClick={() => {
                closeWorkbenchTabsToRight(contextMenu.tabId);
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5 text-indigo-400" /> Close Tabs to Right
            </button>

            <div className="h-px bg-slate-800 my-1" />

            <button
              type="button"
              onClick={() => {
                closeAllWorkbenchTabs();
                setContextMenu(prev => ({ ...prev, isOpen: false }));
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 flex items-center gap-2 font-bold cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Close All Tabs
            </button>
          </div>
        </>,
        document.body
      )}

      {/* ── WORKBENCH TOP BAR ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
        
        {/* Endpoint Name with Inline Editing & Tree Breadcrumb Navigation */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border shrink-0 ${methodColors[method] || methodColors.GET}`}>
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
              <h2 className="font-extrabold text-sm text-white whitespace-nowrap hover:text-indigo-300 transition-colors" title={endpointNode.name}>
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

          {/* Ultra-Stunning Glassmorphism Tree Jump Badge */}
          {breadcrumbPath.length > 0 && (
            <div className="relative group/treebadge shrink-0">
              <button
                type="button"
                onClick={handleJumpToTree}
                className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/40 hover:border-amber-400 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <div className="relative flex items-center justify-center">
                  <Target className="h-4 w-4 text-amber-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                </div>
                <span className="text-[11px] font-mono font-extrabold bg-gradient-to-r from-amber-300 via-amber-200 to-indigo-200 bg-clip-text text-transparent">
                  Tree
                </span>
                <span className="text-[10px] text-amber-400 font-black group-hover/treebadge:translate-x-0.5 group-hover/treebadge:-translate-y-0.5 transition-transform">
                  ↗
                </span>
              </button>

              {/* Floating Glassmorphism Tooltip Card on Hover */}
              <div className="absolute left-0 top-full mt-2 z-[9999] hidden group-hover/treebadge:flex flex-col gap-1 p-2.5 rounded-xl border border-amber-500/30 bg-slate-950/95 backdrop-blur-md shadow-2xl font-mono text-[11px] min-w-[200px] max-w-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 border-b border-slate-800 pb-1">
                  <Target className="h-3 w-3" /> Target Tree Location
                </div>
                <div className="flex items-center flex-wrap gap-1 text-slate-300 text-[10px] font-semibold">
                  {breadcrumbPath.map((p, i) => (
                    <span key={p.id} className="inline-flex items-center gap-1">
                      {i > 0 && <span className="text-slate-600">/</span>}
                      <span className={i === breadcrumbPath.length - 1 ? 'font-bold text-amber-300' : 'text-slate-400'}>
                        {p.name}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {testSuite?.userCustomized && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 text-[10px] font-bold text-amber-400 shrink-0">
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

        {/* ── BODY TAB (COLLAPSIBLE WITH BEAUTIFY & INTERACTIVE VIEWER) ── */}
        {activeRequestTab === 'body' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setBodyPanelCollapsed(!bodyPanelCollapsed)}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${bodyPanelCollapsed ? '-rotate-90' : ''}`} />
                <span>JSON Request Payload</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInteractiveBodyViewer(!showInteractiveBodyViewer)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    showInteractiveBodyViewer
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle interactive tree and search viewer for request body"
                >
                  <ListTree className="h-3.5 w-3.5" />
                  <span>{showInteractiveBodyViewer ? 'Edit Raw Text' : 'Interactive Viewer'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBeautifyJson}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-bold hover:bg-indigo-900 transition-all flex items-center gap-1 cursor-pointer"
                  title="Format JSON payload with 2-space indentation"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Beautify JSON</span>
                </button>
              </div>
            </div>

            {!bodyPanelCollapsed && (
              showInteractiveBodyViewer ? (
                <InteractiveJsonViewer
                  data={bodyText}
                  title="Request Body Viewer"
                />
              ) : (
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={8}
                  placeholder='{ "key": "value" }'
                  className="w-full rounded-2xl border border-slate-800 bg-[#090d16] p-3 text-xs font-mono text-slate-100 focus:border-indigo-500 focus:outline-none leading-relaxed resize-y animate-in fade-in duration-150"
                />
              )
            )}
          </div>
        )}

        {/* ── PARAMS TAB (COLLAPSIBLE + LIVE URL SYNC) ───────────────────── */}
        {activeRequestTab === 'params' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setParamsPanelCollapsed(!paramsPanelCollapsed)}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${paramsPanelCollapsed ? '-rotate-90' : ''}`} />
                <span>Query Parameters ({params.filter(p => p.enabled).length} active)</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  updateParamsAndUrl([...params, { id: String(Date.now()), enabled: true, key: '', value: '' }]);
                  setParamsPanelCollapsed(false);
                }} 
                className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Parameter
              </button>
            </div>
            {!paramsPanelCollapsed && (
              <div className="rounded-2xl border border-slate-800 overflow-visible relative animate-in fade-in duration-150">
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
            )}
          </div>
        )}

        {/* ── HEADERS TAB (COLLAPSIBLE) ───────────────────────────────────────── */}
        {activeRequestTab === 'headers' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setHeadersPanelCollapsed(!headersPanelCollapsed)}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${headersPanelCollapsed ? '-rotate-90' : ''}`} />
                <span>HTTP Headers ({headers.filter(h => h.enabled).length} active)</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setHeaders([...headers, { id: String(Date.now()), enabled: true, key: '', value: '' }]);
                  setHeadersPanelCollapsed(false);
                }} 
                className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Header
              </button>
            </div>
            {!headersPanelCollapsed && (
              <div className="rounded-2xl border border-slate-800 overflow-visible relative animate-in fade-in duration-150">
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
            )}
          </div>
        )}

        {/* ── AUTH TAB (COLLAPSIBLE) ──────────────────────────────────────────── */}
        {activeRequestTab === 'auth' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setAuthPanelCollapsed(!authPanelCollapsed)}
                className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${authPanelCollapsed ? '-rotate-90' : ''}`} />
                <span>Authorization Configuration</span>
              </button>
            </div>

            {!authPanelCollapsed && (
              <div className="space-y-4 animate-in fade-in duration-150">
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

        {/* ── RESPONSE SECTION (COLLAPSIBLE WITH FULL INTERACTIVE BEAUTIFIED JSON VIEWER) ── */}
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

              {/* Rich Interactive JSON Beautifier & Search Viewer */}
              {singleResult ? (
                <InteractiveJsonViewer
                  data={singleResult.responseBody}
                  title="Server Output"
                />
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
              You&apos;ve modified the AI assertions for <span className="text-indigo-300 font-semibold">{endpointNode.name}</span>. Save them as user-customized?
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
