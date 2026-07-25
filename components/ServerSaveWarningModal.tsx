'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  X, 
  LayoutDashboard, 
  Code, 
  Eye, 
  Layers, 
  Server, 
  Folder, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronDown, 
  Key, 
  AlertCircle,
  ChevronsUp,
  ChevronsDown,
  HardDrive
} from 'lucide-react';
import { sanitizeEnvContent } from '@/lib/env-sanitizer';
import { useRunnerStore } from '@/lib/store';
import { parsePostmanCollection, parseEnvironmentContent, formatPostmanUrl } from '@/lib/postman-parser';
import { TreeNode, HttpMethod } from '@/lib/types';

interface ServerSaveWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: 'collection' | 'env';
  rawContent: string;
  userId: string;
  onSuccess: (savedFile: any) => void;
}

// Normalizes any collection schema into TreeNodes with guaranteed unique IDs for tree selection
function normalizeNodesForPicker(parsed: any, fileName: string): {
  rootNodes: TreeNode[];
  allNodeIds: string[];
  totalEndpoints: number;
} {
  const allNodeIds: string[] = [];
  let totalEndpoints = 0;

  if (parsed?.info || parsed?.item) {
    const { rootNodes } = parsePostmanCollection(parsed);
    function collectIds(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        allNodeIds.push(n.id);
        if (n.type === 'endpoint') totalEndpoints++;
        if (n.children) collectIds(n.children);
      });
    }
    collectIds(rootNodes);
    return { rootNodes, allNodeIds, totalEndpoints };
  }

  const rawNodes = Array.isArray(parsed) ? parsed : (parsed?.nodes || []);

  function normalize(nodes: any[], parentId: string | null = null, pathPrefix: string = ''): TreeNode[] {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((item, idx) => {
      const isFolder = item.type === 'folder' || Array.isArray(item.children) || Array.isArray(item.item);
      const nodeId = item.id || `${parentId ? parentId + '-' : 'node-'}${idx + 1}-${isFolder ? 'folder' : 'endpoint'}`;
      const currentPath = pathPrefix ? `${pathPrefix} / ${item.name}` : (item.name || 'Unnamed');

      allNodeIds.push(nodeId);

      if (isFolder) {
        const children = normalize(item.children || item.item || [], nodeId, currentPath);
        return {
          id: nodeId,
          name: item.name || 'Folder',
          type: 'folder',
          description: item.description,
          children,
          parentId,
          path: currentPath,
        };
      } else {
        totalEndpoints++;
        const method = (item.method?.toUpperCase() as HttpMethod) || 'GET';
        const url = item.url || (item.request ? formatPostmanUrl(item.request.url) : '');
        return {
          id: nodeId,
          name: item.name || 'Endpoint',
          type: 'endpoint',
          method,
          url,
          description: item.description,
          request: item.request,
          parentId,
          path: currentPath,
        };
      }
    });
  }

  const rootNodes = normalize(rawNodes);
  return { rootNodes, allNodeIds, totalEndpoints };
}

export const ServerSaveWarningModal: React.FC<ServerSaveWarningModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileType,
  rawContent,
  userId,
  onSuccess
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'visual' | 'raw'>('visual');
  const [previewMode, setPreviewMode] = useState<'sanitized' | 'raw'>('sanitized');
  const [customRedactKeys, setCustomRedactKeys] = useState<Set<string>>(new Set());
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quotaInfo, setQuotaInfo] = useState<{
    maxBytes: number;
    usedBytes: number;
    remainingBytes: number;
    usedPercentage: number;
  }>({
    maxBytes: 1048576,
    usedBytes: 0,
    remainingBytes: 1048576,
    usedPercentage: 0
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetch(`/api/user/files?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.quota) setQuotaInfo(data.quota);
        })
        .catch(() => {});
    }
  }, [isOpen, userId]);
  
  // Collapse States (COLLAPSED BY DEFAULT)
  const [isPickerExpanded, setIsPickerExpanded] = useState(false);
  const [isEnvTableExpanded, setIsEnvTableExpanded] = useState(false);
  const [expandedTreeFolders, setExpandedTreeFolders] = useState<Record<string, boolean>>({});

  const { envVariables } = useRunnerStore();

  let parsedCollection: any = null;
  try {
    if (fileType === 'collection' || rawContent.trim().startsWith('{')) {
      parsedCollection = JSON.parse(rawContent);
    }
  } catch (e) {}

  const { rootNodes: normalizedPickerNodes, allNodeIds: pickerNodeIds, totalEndpoints: totalEndpointsCount } = normalizeNodesForPicker(parsedCollection, fileName);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set(pickerNodeIds));

  // Keep selectedNodeIds in sync whenever modal opens or rawContent changes
  useEffect(() => {
    if (isOpen && pickerNodeIds.length > 0) {
      setSelectedNodeIds(new Set(pickerNodeIds));
    }
  }, [isOpen, rawContent]);

  // Parse Environment Key-Values strictly
  function getCombinedEnvEntries(type: string, raw: string): { key: string; val: string }[] {
    const map = new Map<string, string>();

    if (type === 'env') {
      // Environment File Save Mode: Parse strictly via master environment parser
      const { envMap } = parseEnvironmentContent(raw);
      Object.entries(envMap).forEach(([k, v]) => {
        if (k) map.set(k, String(v || ''));
      });

      // Fallback to active workspace memory if raw file content was empty
      if (map.size === 0 && envVariables) {
        Object.entries(envVariables).forEach(([k, v]) => {
          if (k) map.set(k, String(v || ''));
        });
      }
    } else {
      // Collection File Save Mode: Only include active environment variables configured in workspace memory
      if (envVariables) {
        Object.entries(envVariables).forEach(([k, v]) => {
          if (k) map.set(k, String(v || ''));
        });
      }
    }

    return Array.from(map.entries()).map(([key, val]) => ({ key, val }));
  }

  const envEntries = getCombinedEnvEntries(fileType, rawContent);
  const [selectedEnvKeys, setSelectedEnvKeys] = useState<Set<string>>(() => new Set(envEntries.map((e) => e.key)));

  useEffect(() => {
    if (isOpen && envEntries.length > 0) {
      setSelectedEnvKeys(new Set(envEntries.map((e) => e.key)));
    }
  }, [isOpen, rawContent]);

  const toggleNodeSelection = (id: string, children?: TreeNode[]) => {
    const next = new Set(selectedNodeIds);
    const shouldSelect = !next.has(id);

    function toggleSubtree(nodeId: string, subNodes?: TreeNode[]) {
      if (shouldSelect) next.add(nodeId);
      else next.delete(nodeId);

      if (Array.isArray(subNodes)) {
        subNodes.forEach((child) => {
          toggleSubtree(child.id, child.children);
        });
      }
    }

    toggleSubtree(id, children);
    setSelectedNodeIds(next);
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedTreeFolders((prev) => ({ ...prev, [folderId]: !(prev[folderId] ?? true) }));
  };

  if (!isOpen) return null;

  const { sanitized, redactedKeys } = sanitizeEnvContent(rawContent);

  const handleSave = async (allowRawSecrets: boolean) => {
    if (allowRawSecrets && !acceptedResponsibility) {
      setError('You must check the box to acknowledge sole responsibility before saving raw unredacted secrets.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      let finalContentToSave = allowRawSecrets ? rawContent : sanitized;
      if (fileType === 'collection' && normalizedPickerNodes.length > 0) {
        function filterNodes(nodes: TreeNode[]): TreeNode[] {
          return nodes
            .filter((n) => selectedNodeIds.has(n.id))
            .map((n) => {
              if (n.children) {
                return { ...n, children: filterNodes(n.children) };
              }
              return n;
            });
        }
        const filteredNodes = filterNodes(normalizedPickerNodes);
        finalContentToSave = JSON.stringify({ name: fileName, nodes: filteredNodes }, null, 2);
      }

      // 1. Save Collection JSON file
      const res = await fetch('/api/user/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fileName,
          fileType,
          content: finalContentToSave,
          allowRawSecrets
        })
      });

      const data = await res.json();

      // 2. Save separate .env Environment File if envEntries exist & keys are selected
      if (envEntries.length > 0 && selectedEnvKeys.size > 0) {
        const selectedEntries = envEntries.filter((e) => selectedEnvKeys.has(e.key));
        const envContentStr = selectedEntries.map((e) => `${e.key}=${e.val}`).join('\n');
        const envFileName = fileName.replace(/\.(json|postman_collection\.json)$/i, '') + '.env';

        await fetch('/api/user/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileName: envFileName,
            fileType: 'env',
            content: envContentStr,
            allowRawSecrets
          })
        });
      }

      setSaving(false);

      if (data.success) {
        onSuccess(data.file);
        onClose();
      } else {
        setError(data.error || 'Failed to save file');
      }
    } catch (err: any) {
      setSaving(false);
      setError(err.message || 'Error saving file');
    }
  };

  const currentDisplayContent = previewMode === 'sanitized' ? sanitized : rawContent;

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-5 my-auto text-left relative max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Server Workspace Save & Security Redactor
              </h2>
              <p className="text-xs text-slate-400">
                File: <code className="text-amber-300 font-bold">{fileName}</code>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File Type Badge Notice */}
        <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
            {fileType === 'collection' ? '📂 Postman API Collection (.json)' : '🔑 Environment Key-Value File (.env)'}
          </span>
          <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-200 px-2.5 py-0.5 rounded-md border border-indigo-500/40">
            {fileType.toUpperCase()}
          </span>
        </div>

        {/* View Mode Tabs (Visual Dashboard vs Raw Code) & Sanitized Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveViewTab('visual')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeViewTab === 'visual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>📊 Visual Dashboard View</span>
            </button>
            <button
              onClick={() => setActiveViewTab('raw')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeViewTab === 'raw' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>📄 Raw File Code</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
            <button
              onClick={() => setPreviewMode('sanitized')}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                previewMode === 'sanitized' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Sanitized Preview
            </button>
            <button
              onClick={() => setPreviewMode('raw')}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                previewMode === 'raw' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Raw File View
            </button>
          </div>
        </div>

        {/* TAB 1: VISUAL DASHBOARD VIEW */}
        {activeViewTab === 'visual' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Format Detected</span>
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono">
                  <Server className="h-4 w-4 text-indigo-400" /> {fileType === 'collection' ? 'JSON COLLECTION' : 'ENV KEY-VALUE'}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Total Records</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <Layers className="h-4 w-4 text-emerald-400" /> {fileType === 'collection' ? `${selectedNodeIds.size} / ${pickerNodeIds.length} Nodes` : `${envEntries.length} Variables`}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Redaction Status</span>
                <span className={`text-xs font-bold flex items-center gap-1.5 font-mono ${previewMode === 'raw' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <Lock className="h-4 w-4" /> {previewMode === 'raw' ? '0 Redacted (RAW SECRETS EXPOSED)' : `${redactedKeys.length} Secret(s) Redacted`}
                </span>
              </div>
            </div>

            {/* COLLAPSIBLE COLLECTION FOLDER & ENDPOINT PICKER TREE WITH TOOLBAR CONTROLS */}
            {fileType === 'collection' && normalizedPickerNodes.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
                <div 
                  onClick={() => setIsPickerExpanded(!isPickerExpanded)}
                  className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer transition-all border-b border-slate-800/80"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-amber-400 font-bold text-xs">{isPickerExpanded ? '▼' : '▶'}</span>
                    <Folder className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white">
                      Selective Endpoint & Folder Picker ({selectedNodeIds.size} Selected)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isPickerExpanded ? 'Click to Collapse Tree' : 'Click to Expand Tree Picker'}
                  </span>
                </div>

                {isPickerExpanded && (
                  <div className="animate-in fade-in">
                    {/* Tree Picker Header Controls (Collapse All, Expand All, Select All, None) */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] font-mono">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next: Record<string, boolean> = {};
                            pickerNodeIds.forEach((id) => { next[id] = false; });
                            setExpandedTreeFolders(next);
                          }}
                          className="inline-flex items-center space-x-1 text-slate-400 hover:text-amber-400 font-medium"
                          title="Collapse All Folders"
                        >
                          <ChevronsUp className="h-3.5 w-3.5 text-amber-400" />
                          <span>Collapse</span>
                        </button>

                        <span className="text-slate-700">|</span>

                        <button
                          type="button"
                          onClick={() => {
                            const next: Record<string, boolean> = {};
                            pickerNodeIds.forEach((id) => { next[id] = true; });
                            setExpandedTreeFolders(next);
                          }}
                          className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-400 font-medium"
                          title="Expand All Folders"
                        >
                          <ChevronsDown className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Expand</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedNodeIds(new Set(pickerNodeIds))}
                          className="text-indigo-400 hover:underline font-bold"
                        >
                          All
                        </button>
                        <span className="text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedNodeIds(new Set())}
                          className="text-slate-400 hover:underline font-bold"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 max-h-60 overflow-y-auto custom-scrollbar space-y-2 font-mono text-xs">
                      {(() => {
                        function renderTreeNode(n: TreeNode, depth = 0) {
                          const isSelected = selectedNodeIds.has(n.id);
                          const isFolder = n.type === 'folder' || (n.children && n.children.length > 0);
                          const isFolderExpanded = expandedTreeFolders[n.id] ?? true;

                          return (
                            <div key={n.id} style={{ marginLeft: `${depth * 16}px` }} className="space-y-1">
                              <div className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer select-none">
                                {/* Subfolder Collapse Arrow */}
                                {isFolder ? (
                                  <button type="button" onClick={() => toggleFolderExpand(n.id)} className="text-amber-400 p-0.5 hover:text-white">
                                    {isFolderExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  </button>
                                ) : (
                                  <span className="w-3.5" />
                                )}

                                <button type="button" onClick={() => toggleNodeSelection(n.id, n.children)} className="text-indigo-400">
                                  {isSelected ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4 text-slate-600" />}
                                </button>
                                
                                {isFolder ? <Folder className="h-3.5 w-3.5 text-amber-400" /> : <FileText className="h-3.5 w-3.5 text-emerald-400" />}
                                <span 
                                  onClick={() => isFolder ? toggleFolderExpand(n.id) : toggleNodeSelection(n.id, n.children)}
                                  className={isSelected ? 'text-white font-bold' : 'text-slate-500 line-through'}
                                >
                                  {n.name}
                                </span>
                                
                                {n.method && (
                                  <span className="rounded bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 text-[9px] font-bold">
                                    {n.method}
                                  </span>
                                )}
                              </div>

                              {isFolder && isFolderExpanded && n.children && n.children.map((c) => renderTreeNode(c, depth + 1))}
                            </div>
                          );
                        }
                        return normalizedPickerNodes.map((n) => renderTreeNode(n, 0));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ENVIRONMENT VARIABLES TABLE (COLLAPSIBLE & COLLAPSED BY DEFAULT) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800/80 gap-2">
                <div 
                  onClick={() => setIsEnvTableExpanded(!isEnvTableExpanded)}
                  className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <span className="text-amber-400 font-bold text-xs">{isEnvTableExpanded ? '▼' : '▶'}</span>
                  <Key className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">
                    Environment Variables & Secret Redaction Table ({selectedEnvKeys.size} / {envEntries.length} Keys Selected)
                  </h4>
                </div>

                {/* Environment Table Toolbar (Collapse, Expand, Select All, None) */}
                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setIsEnvTableExpanded(false)}
                    className="inline-flex items-center space-x-1 text-slate-400 hover:text-amber-400 font-medium"
                    title="Collapse Table"
                  >
                    <ChevronsUp className="h-3.5 w-3.5 text-amber-400" />
                    <span>Collapse</span>
                  </button>

                  <span className="text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setIsEnvTableExpanded(true)}
                    className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-400 font-medium"
                    title="Expand Table"
                  >
                    <ChevronsDown className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Expand</span>
                  </button>

                  <span className="text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setSelectedEnvKeys(new Set(envEntries.map((e) => e.key)))}
                    className="text-indigo-400 hover:underline font-bold"
                  >
                    Select All
                  </button>

                  <span className="text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setSelectedEnvKeys(new Set())}
                    className="text-slate-400 hover:underline font-bold"
                  >
                    Select None
                  </button>

                  <span className="text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setCustomRedactKeys(new Set(envEntries.map((e) => e.key)))}
                    className="text-emerald-400 hover:underline font-bold"
                    title="Force redact all values before saving to server"
                  >
                    🔒 Redact All
                  </button>

                  <span className="text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => setCustomRedactKeys(new Set())}
                    className="text-amber-400 hover:underline font-bold"
                    title="Clear force-redaction overrides"
                  >
                    🔓 Reset Redactions
                  </button>
                </div>
              </div>

              {isEnvTableExpanded && (
                <div className="relative max-h-64 overflow-x-auto overflow-y-auto custom-scrollbar animate-in fade-in rounded-b-2xl border-t border-slate-800">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="sticky top-0 z-20 bg-[#0f172a] text-slate-300 text-[10px] uppercase border-b border-slate-700 shadow-md backdrop-blur-md">
                      <tr>
                        <th className="p-3 w-10 text-center bg-[#0f172a]">Select</th>
                        <th className="p-3 w-52 min-w-[180px] bg-[#0f172a]">Key Name</th>
                        <th className="p-3 w-64 min-w-[220px] bg-[#0f172a]">Raw Value (Masked)</th>
                        <th className="p-3 w-64 min-w-[220px] bg-[#0f172a]">Server Preview Value</th>
                        <th className="p-3 w-32 text-right shrink-0 bg-[#0f172a]">Redaction Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {envEntries.map((entry, idx) => {
                        const isSecretKey = /key|token|secret|pass|auth|jwt|bearer|private|credential|pwd|cert|salt/i.test(entry.key);
                        const isForceRedacted = customRedactKeys.has(entry.key);
                        const isRedactedInSanitized = isSecretKey || redactedKeys.includes(entry.key) || isForceRedacted;
                        const isEnvSelected = selectedEnvKeys.has(entry.key);

                        return (
                          <tr key={entry.key || idx} className="hover:bg-slate-900/60 transition-all">
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = new Set(selectedEnvKeys);
                                  if (next.has(entry.key)) next.delete(entry.key);
                                  else next.add(entry.key);
                                  setSelectedEnvKeys(next);
                                }}
                                className="text-amber-400 hover:text-white"
                              >
                                {isEnvSelected ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4 text-slate-600" />}
                              </button>
                            </td>
                            <td className="p-3 font-bold whitespace-nowrap truncate max-w-[180px]" title={entry.key}>
                              <span className={isEnvSelected ? 'text-slate-200' : 'text-slate-500 line-through'}>
                                {entry.key}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono whitespace-nowrap truncate max-w-[220px]" title={entry.val}>
                              {isSecretKey || isForceRedacted ? '••••••••••••••••' : entry.val}
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap truncate max-w-[220px]">
                              {previewMode === 'sanitized' && isRedactedInSanitized ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px]">
                                  [REDACTED_SECRET]
                                </span>
                              ) : (
                                <span className={isSecretKey ? 'text-amber-300 font-bold' : 'text-slate-300'}>{entry.val}</span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = new Set(customRedactKeys);
                                  if (next.has(entry.key)) next.delete(entry.key);
                                  else next.add(entry.key);
                                  setCustomRedactKeys(next);
                                }}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isRedactedInSanitized 
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900' 
                                    : 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900'
                                }`}
                                title="Click to toggle force redaction on server save"
                              >
                                {isRedactedInSanitized ? <Lock className="h-3 w-3 text-emerald-400" /> : <Eye className="h-3 w-3 text-amber-400" />}
                                <span>{isRedactedInSanitized ? '🛡️ Redact Value' : '🔴 Keep Plaintext'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RAW FILE CODE VIEW */}
        {activeViewTab === 'raw' && (
          <div className="space-y-2 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-slate-300 block">Code Preview ({previewMode.toUpperCase()}):</span>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 max-h-60 overflow-y-auto custom-scrollbar font-mono text-xs text-slate-300 leading-relaxed space-y-1">
              {currentDisplayContent.split('\n').map((line, idx) => {
                const isRedactedLine = line.includes('[REDACTED_SECRET]');
                return (
                  <div key={idx} className={isRedactedLine ? 'text-emerald-400 font-bold bg-emerald-950/30 px-1.5 rounded' : ''}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1 MB SERVER STORAGE QUOTA METER CARD */}
        <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/30 p-4 space-y-2 text-left backdrop-blur-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-indigo-400" /> Server Storage Quota Meter (Max 1.00 MB Total)
            </span>
            <span className="font-mono text-xs font-bold text-indigo-300">
              {(quotaInfo.usedBytes / 1024).toFixed(1)} KB / 1.00 MB Used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-300 ${
                quotaInfo.usedPercentage >= 90 ? 'bg-red-500' :
                quotaInfo.usedPercentage >= 75 ? 'bg-amber-500' :
                'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(100, quotaInfo.usedPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono pt-1">
            <span>Storage Status: {quotaInfo.usedPercentage}% Used</span>
            <span className={quotaInfo.remainingBytes < 102400 ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
              {(quotaInfo.remainingBytes / 1024).toFixed(1)} KB Remaining Quota
            </span>
          </div>
        </div>

        {/* Mandatory Legal Liability Disclaimer */}
        <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-4 space-y-3">
          <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>Sole Responsibility & Liability Disclaimer</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            While we automatically redact sensitive values, if you explicitly choose to override redaction and store raw unredacted secret keys on our server, you assume **sole and full responsibility** for your credentials. The platform and site owner shall not be liable for any credential exposure or unauthorized usage.
          </p>

          <label className="flex items-start space-x-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedResponsibility}
              onChange={(e) => setAcceptedResponsibility(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-amber-200 font-semibold leading-snug">
              I understand and accept full responsibility for storing my environment configurations on the server.
            </span>
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-xs text-red-300 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : '🛡️ Save Sanitized (Recommended)'}
          </button>

          <button
            type="button"
            disabled={saving || !acceptedResponsibility}
            onClick={() => handleSave(true)}
            className="w-full sm:w-auto rounded-xl border border-amber-700 bg-amber-950/80 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-amber-900 transition-all disabled:opacity-40"
          >
            ⚠️ Save Unredacted (Raw Secrets)
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
