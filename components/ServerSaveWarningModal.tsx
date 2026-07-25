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
  ChevronsDown
} from 'lucide-react';
import { sanitizeEnvContent } from '@/lib/env-sanitizer';
import { useRunnerStore } from '@/lib/store';
import { parsePostmanCollection, formatPostmanUrl } from '@/lib/postman-parser';
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
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  // Parse Environment Key-Values
  function getCombinedEnvEntries(type: string, raw: string): { key: string; val: string }[] {
    const map = new Map<string, string>();

    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      try {
        const json = JSON.parse(trimmed);
        if (json.values && Array.isArray(json.values)) {
          json.values.forEach((v: any) => {
            if (v.key) map.set(v.key, String(v.value || ''));
          });
        }
        if (json.variable && Array.isArray(json.variable)) {
          json.variable.forEach((v: any) => {
            if (v.key) map.set(v.key, String(v.value || ''));
          });
        }
      } catch {}
    }

    if (map.size === 0 && envVariables) {
      Object.entries(envVariables).forEach(([k, v]) => {
        if (k) map.set(k, String(v || ''));
      });
    }

    trimmed.split('\n').forEach((line) => {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.startsWith('#')) return;
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const k = line.substring(0, eqIdx).trim();
        const v = line.substring(eqIdx + 1).trim();
        if (k) map.set(k, v);
      }
    });

    return Array.from(map.entries()).map(([key, val]) => ({ key, val }));
  }

  const envEntries = getCombinedEnvEntries(fileType, rawContent);

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
              <div 
                onClick={() => setIsEnvTableExpanded(!isEnvTableExpanded)}
                className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer transition-all border-b border-slate-800/80"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-amber-400 font-bold text-xs">{isEnvTableExpanded ? '▼' : '▶'}</span>
                  <Key className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">
                    Environment Variables & Secret Redaction Table ({envEntries.length} Keys)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isEnvTableExpanded ? 'Click to Collapse Table' : 'Click to Expand Table'}
                </span>
              </div>

              {isEnvTableExpanded && (
                <div className="p-4 overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-52 min-w-[200px]">Key Name</th>
                        <th className="p-3 w-64 min-w-[240px]">Raw Value (Masked)</th>
                        <th className="p-3 w-64 min-w-[240px]">Server Preview Value</th>
                        <th className="p-3 w-28 text-right shrink-0">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {envEntries.map((entry, idx) => {
                        const isSecretKey = /key|token|secret|pass|auth|jwt|bearer|private|credential|pwd|cert|salt/i.test(entry.key);
                        const isRedactedInSanitized = isSecretKey || redactedKeys.includes(entry.key);

                        return (
                          <tr key={entry.key || idx} className="hover:bg-slate-900/60 transition-all">
                            <td className="p-3 font-bold text-slate-200 whitespace-nowrap truncate max-w-[200px]" title={entry.key}>
                              {entry.key}
                            </td>
                            <td className="p-3 text-slate-400 font-mono whitespace-nowrap truncate max-w-[240px]" title={entry.val}>
                              {isSecretKey ? '••••••••••••••••' : entry.val}
                            </td>
                            <td className="p-3 font-mono whitespace-nowrap truncate max-w-[240px]">
                              {previewMode === 'sanitized' && isRedactedInSanitized ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px]">
                                  [REDACTED_SECRET]
                                </span>
                              ) : (
                                <span className={isSecretKey ? 'text-amber-300 font-bold' : 'text-slate-300'}>{entry.val}</span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap shrink-0">
                              {previewMode === 'sanitized' && isRedactedInSanitized ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  🛡️ Redacted
                                </span>
                              ) : previewMode === 'raw' && isSecretKey ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                  🔴 Exposed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                  Standard
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
