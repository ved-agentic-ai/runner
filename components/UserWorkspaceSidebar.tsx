'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  FileCode, 
  Key, 
  Trash2, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  FileText,
  ChevronsUp,
  ChevronsDown,
  CheckSquare,
  Square,
  HardDrive,
  Search
} from 'lucide-react';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { useAdminStore } from '@/lib/admin-store';
import { useRunnerStore } from '@/lib/store';
import { parseAndNormalizeServerCollection } from '@/lib/collection-parser';
import { TreeNode } from '@/lib/types';

interface UserWorkspaceSidebarProps {
  onLoadFileToWorkspace: (file: any) => void;
  refreshTrigger?: number;
}

export const UserWorkspaceSidebar: React.FC<UserWorkspaceSidebarProps> = ({
  onLoadFileToWorkspace,
  refreshTrigger
}) => {
  const { user, isAuthenticated } = useUserAuthStore();
  const { serverStoragePaused } = useAdminStore();
  const setSelectedEndpointIdForDetail = useRunnerStore((s) => s.setSelectedEndpointIdForDetail);

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [envExpanded, setEnvExpanded] = useState(true);
  const [loadedFileId, setLoadedFileId] = useState<string | null>(null);
  
  const [quota, setQuota] = useState<{
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

  // Expanded collection tree preview states in sidebar
  const [expandedFileTreeIds, setExpandedFileTreeIds] = useState<Record<string, boolean>>({});
  // Per-file subfolder expansion state
  const [expandedSubfolders, setExpandedSubfolders] = useState<Record<string, boolean>>({});
  // Per-file selection state
  const [selectedSidebarNodeIds, setSelectedSidebarNodeIds] = useState<Record<string, Set<string>>>({});
  // Expanded env file preview keys state
  const [expandedEnvFileIds, setExpandedEnvFileIds] = useState<Record<string, boolean>>({});

  // Custom Delete Modal State
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inspected Environment Key Details Modal State
  const [inspectedEnvKey, setInspectedEnvKey] = useState<{ fileName: string; key: string; val: string } | null>(null);

  const fetchUserFiles = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/user/files?userId=${user.id}`);
      const data = await res.json();
      setLoading(false);
      if (data.success && data.files) {
        setFiles(data.files);
        if (data.quota) {
          setQuota(data.quota);
        }
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFiles();
  }, [user?.id, isAuthenticated, refreshTrigger]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Separate search filter queries for Server Explorer
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [envSearchQuery, setEnvSearchQuery] = useState('');

  const collections = files.filter((f) => {
    if (f.fileType !== 'collection') return false;
    if (!collectionSearchQuery.trim()) return true;
    const q = collectionSearchQuery.toLowerCase();
    return f.fileName.toLowerCase().includes(q) || (f.content || '').toLowerCase().includes(q);
  });

  const envFiles = files.filter((f) => {
    if (f.fileType !== 'env') return false;
    if (!envSearchQuery.trim()) return true;
    const q = envSearchQuery.toLowerCase();
    return f.fileName.toLowerCase().includes(q) || (f.content || '').toLowerCase().includes(q);
  });

  const confirmDeleteFile = async (deleteScope: 'server_only' | 'both') => {
    if (!fileToDelete || !user) return;
    setDeleting(true);
    try {
      await fetch(`/api/user/files?fileId=${fileToDelete.id}&userId=${user.id}`, { method: 'DELETE' });
      
      if (deleteScope === 'both') {
        useRunnerStore.setState({
          serverCollectionName: '',
          serverRootNodes: [],
          serverFlatEndpointMap: new Map(),
        });
      }

      setDeleting(false);
      setFileToDelete(null);
      fetchUserFiles();
    } catch (err) {
      setDeleting(false);
    }
  };

  const toggleSidebarFileTree = (fileId: string) => {
    setExpandedFileTreeIds((prev) => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const toggleSubfolder = (folderId: string) => {
    setExpandedSubfolders((prev) => ({ ...prev, [folderId]: !(prev[folderId] ?? true) }));
  };

  // Helper to parse tree nodes for sidebar inline hierarchy
  function parseSidebarTreeNodes(content: string, fileName: string): { rootNodes: TreeNode[]; allNodeIds: string[]; totalEndpoints: number } {
    try {
      const parsed = JSON.parse(content);
      const { rootNodes, flatEndpointMap, allNodeIds } = parseAndNormalizeServerCollection(parsed, fileName);
      return { rootNodes, allNodeIds, totalEndpoints: flatEndpointMap.size };
    } catch (err) {
      return { rootNodes: [], allNodeIds: [], totalEndpoints: 0 };
    }
  }

  // Recursive tree filtering for sidebar preview box
  function filterSidebarNodes(nodes: TreeNode[], query: string): TreeNode[] {
    const q = query.trim().toLowerCase();
    if (!q) return nodes;

    function walk(list: TreeNode[], parentFolderMatched = false): TreeNode[] {
      const result: TreeNode[] = [];
      list.forEach((node) => {
        if (node.type === 'folder') {
          const folderMatches = node.name.toLowerCase().includes(q);
          const childrenMatched = walk(node.children || [], parentFolderMatched || folderMatches);
          if (childrenMatched.length > 0 || folderMatches) {
            result.push({ ...node, children: childrenMatched });
          }
        } else {
          const nameMatch = node.name.toLowerCase().includes(q);
          const methodMatch = node.method?.toLowerCase().includes(q);
          const urlMatch = node.url?.toLowerCase().includes(q);
          if (nameMatch || methodMatch || urlMatch || parentFolderMatched) {
            result.push(node);
          }
        }
      });
      return result;
    }

    return walk(nodes);
  }

  const handleEndpointClick = (node: TreeNode) => {
    // Ensure node is registered in Zustand store flatEndpointMap so EndpointDetailSheet can open it cleanly
    const state = useRunnerStore.getState();
    if (!state.flatEndpointMap.has(node.id)) {
      state.flatEndpointMap.set(node.id, node);
    }
    setSelectedEndpointIdForDetail(node.id);
  };

  function toggleSidebarNodeSelection(fileId: string, nodeId: string, allIds: string[], subNodes?: TreeNode[]) {
    const currentSet = new Set(selectedSidebarNodeIds[fileId] || allIds);
    const shouldSelect = !currentSet.has(nodeId);

    function toggleSubtree(id: string, children?: TreeNode[]) {
      if (shouldSelect) currentSet.add(id);
      else currentSet.delete(id);

      if (Array.isArray(children)) {
        children.forEach((c) => toggleSubtree(c.id, c.children));
      }
    }

    toggleSubtree(nodeId, subNodes);
    const nextSet = new Set(currentSet);
    setSelectedSidebarNodeIds((prev) => ({ ...prev, [fileId]: nextSet }));

    // Sync directly into Zustand selectedNodeIds
    useRunnerStore.setState({
      selectedNodeIds: Array.from(nextSet)
    });
  }

  function renderSidebarTree(fileId: string, nodes: TreeNode[], allNodeIds: string[], depth = 0) {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    const fileSelectedSet = selectedSidebarNodeIds[fileId] || new Set(allNodeIds);

    return nodes.map((node, idx) => {
      const isFolder = node.type === 'folder' || (node.children && node.children.length > 0);
      const isExpanded = expandedSubfolders[node.id] ?? true;
      const isSelected = fileSelectedSet.has(node.id);

      return (
        <div key={node.id || idx} style={{ marginLeft: `${depth * 12}px` }} className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer select-none group">
            <div className="flex items-center space-x-1.5 min-w-0">
              {/* Subfolder Collapse Arrow */}
              {isFolder ? (
                <button type="button" onClick={() => toggleSubfolder(node.id)} className="text-amber-400 p-0.5 hover:text-white shrink-0">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}

              {/* Checkbox */}
              <button 
                type="button" 
                onClick={() => toggleSidebarNodeSelection(fileId, node.id, allNodeIds, node.children)}
                className="text-indigo-400 shrink-0"
              >
                {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
              </button>

              {/* Icon */}
              {isFolder ? (
                <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              )}

              {/* Node Name (Click Endpoint to Inspect Details) */}
              <span 
                onClick={() => isFolder ? toggleSubfolder(node.id) : handleEndpointClick(node)}
                className={`truncate ${isSelected ? 'text-slate-200 font-bold group-hover:text-indigo-300' : 'text-slate-500 line-through'}`}
                title={node.name}
              >
                {node.name}
              </span>
            </div>

            {/* Method Badge */}
            {node.method && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ml-2 ${
                node.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                node.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                node.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {node.method}
              </span>
            )}
          </div>

          {isFolder && isExpanded && node.children && renderSidebarTree(fileId, node.children, allNodeIds, depth + 1)}
        </div>
      );
    });
  }

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Folder className="h-4 w-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white">Server Workspace Explorer</h3>
        </div>
        <button
          onClick={fetchUserFiles}
          className="p-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
          title="Refresh server files"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1 MB SERVER STORAGE QUOTA METER CARD */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 space-y-2 text-left">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-indigo-400" /> Server Storage Quota
          </span>
          <span className="font-mono text-[11px] font-bold text-indigo-300">
            {(quota.usedBytes / 1024).toFixed(1)} KB / 1.00 MB
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-300 ${
              quota.usedPercentage >= 90 ? 'bg-red-500' :
              quota.usedPercentage >= 75 ? 'bg-amber-500' :
              'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${Math.min(100, quota.usedPercentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Used: {quota.usedPercentage}%</span>
          <span className={quota.remainingBytes < 102400 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
    {(quota.remainingBytes / 1024).toFixed(1)} KB Remaining
          </span>
        </div>
      </div>

      {/* TREE VIEW: API COLLECTIONS */}
      <div className="space-y-2">
        <div 
          onClick={() => setCollectionsExpanded(!collectionsExpanded)}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
            {collectionsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <FileCode className="h-4 w-4 text-indigo-400" />
            <span>
              API Collections ({collections.length}
              {collectionSearchQuery.trim() && ` / ${files.filter((f) => f.fileType === 'collection').length}`}
              )
            </span>
          </div>
        </div>

        {collectionsExpanded && (
          <div className="pl-1 space-y-2 pt-1">
            {/* Dedicated Collection Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search endpoints in collections..."
                value={collectionSearchQuery}
                onChange={(e) => setCollectionSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              {collectionSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCollectionSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {collections.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">
                {collectionSearchQuery ? `No collections match "${collectionSearchQuery}".` : 'No collections saved on server.'}
              </p>
            ) : (
              collections.map((f) => {
                const { rootNodes: sidebarTree, allNodeIds, totalEndpoints } = parseSidebarTreeNodes(f.content, f.fileName);
                const displaySidebarTree = filterSidebarNodes(sidebarTree, collectionSearchQuery);
                const isTreeExpanded = collectionSearchQuery.trim().length > 0 ? true : (expandedFileTreeIds[f.id] ?? false);
                const fileSelectedSet = selectedSidebarNodeIds[f.id] || new Set(allNodeIds);

                function countSidebarStats(nodes: TreeNode[]): { nodes: number; endpoints: number } {
                  let nCnt = 0;
                  let eCnt = 0;
                  function walk(list: TreeNode[]) {
                    list.forEach((n) => {
                      nCnt++;
                      if (n.type === 'endpoint') eCnt++;
                      if (n.children) walk(n.children);
                    });
                  }
                  walk(nodes);
                  return { nodes: nCnt, endpoints: eCnt };
                }

                const displayStats = countSidebarStats(displaySidebarTree);

                return (
                  <div 
                    key={f.id} 
                    className={`rounded-2xl border p-3 text-xs space-y-2.5 transition-all ${
                      loadedFileId === f.id ? 'border-emerald-800/80 bg-emerald-950/20' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <button 
                          onClick={() => toggleSidebarFileTree(f.id)}
                          className="text-slate-400 hover:text-amber-400 p-0.5"
                          title={isTreeExpanded ? 'Collapse Tree Preview' : 'Expand Tree Preview'}
                        >
                          {isTreeExpanded ? <ChevronDown className="h-4 w-4 text-amber-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        </button>
                        <span className="font-bold text-slate-200 truncate max-w-[160px]" title={f.fileName}>{f.fileName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {loadedFileId === f.id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadFileToWorkspace({
                                ...f,
                                selectedNodeIds: Array.from(fileSelectedSet)
                              });
                              setLoadedFileId(f.id);
                            }}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 shadow-sm"
                          >
                            Load
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => setFileToDelete({ id: f.id, name: f.fileName })}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800"
                          title="Delete collection"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(f.updatedAt).toLocaleDateString()}
                      </span>
                      {collectionSearchQuery.trim() ? (
                        <span className="font-bold text-amber-300 animate-in fade-in">
                          Showing {displayStats.nodes} / {allNodeIds.length} Nodes ({displayStats.endpoints} / {totalEndpoints} Endpoints)
                        </span>
                      ) : (
                        <span className="font-bold text-slate-300">
                          {allNodeIds.length} Nodes ({totalEndpoints} Endpoints)
                        </span>
                      )}
                    </div>

                    {isTreeExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1">
                          <button
                            type="button"
                            onClick={() => toggleSidebarFileTree(f.id)}
                            className="inline-flex items-center space-x-1 text-slate-400 hover:text-amber-400 font-semibold"
                          >
                            <ChevronsUp className="h-3 w-3 text-amber-400" />
                            <span>Collapse</span>
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSubfolders((prev) => {
                                const next = { ...prev };
                                function setSubFolders(nodes: TreeNode[]) {
                                  nodes.forEach((n) => {
                                    if (n.type === 'folder') {
                                      next[n.id] = true;
                                      if (n.children) setSubFolders(n.children);
                                    }
                                  });
                                }
                                setSubFolders(sidebarTree);
                                return next;
                              });
                            }}
                            className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-400 font-semibold"
                          >
                            <ChevronsDown className="h-3 w-3 text-indigo-400" />
                            <span>Expand</span>
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSidebarNodeIds((prev) => ({ ...prev, [f.id]: new Set(allNodeIds) }));
                            }}
                            className="text-indigo-400 hover:underline font-semibold"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSidebarNodeIds((prev) => ({ ...prev, [f.id]: new Set() }));
                            }}
                            className="text-slate-400 hover:underline font-semibold"
                          >
                            None
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto overflow-x-auto custom-scrollbar bg-slate-950/60 rounded-xl p-2 border border-slate-800 text-left">
                          {displaySidebarTree.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic p-1 block">No endpoints match "{collectionSearchQuery}"</span>
                          ) : (
                            <div className="min-w-max text-nowrap">
                              {renderSidebarTree(f.id, displaySidebarTree, allNodeIds)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* TREE VIEW: ENVIRONMENT FILES */}
      <div className="space-y-2 pt-2">
        <div 
          onClick={() => setEnvExpanded(!envExpanded)}
          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
        >
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
            {envExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Key className="h-4 w-4 text-amber-400" />
            <span>
              Environment Files ({envFiles.length}
              {envSearchQuery.trim() && ` / ${files.filter((f) => f.fileType === 'env').length}`}
              )
            </span>
          </div>
        </div>

        {envExpanded && (
          <div className="pl-1 space-y-2 pt-1">
            {/* Dedicated Environment Search Bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-amber-500/80" />
              <input
                type="text"
                placeholder="Search env keys or values..."
                value={envSearchQuery}
                onChange={(e) => setEnvSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              {envSearchQuery && (
                <button
                  type="button"
                  onClick={() => setEnvSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-[11px] font-bold text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {envFiles.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">
                {envSearchQuery ? `No .env files match "${envSearchQuery}".` : 'No .env files saved on server.'}
              </p>
            ) : (
              envFiles.map((f) => {
                // Parse key-value entries for collapsible preview & inspection
                const rawKeyEntries: { key: string; val: string }[] = [];
                const trimmed = (f.content || '').trim();
                if (trimmed.startsWith('{')) {
                  try {
                    const json = JSON.parse(trimmed);
                    if (json.values && Array.isArray(json.values)) {
                      json.values.forEach((v: any) => { if (v.key) rawKeyEntries.push({ key: v.key, val: String(v.value || '') }); });
                    } else {
                      Object.entries(json).forEach(([k, v]) => rawKeyEntries.push({ key: k, val: String(v || '') }));
                    }
                  } catch (e) {}
                } else {
                  trimmed.split('\n').forEach((l: string) => {
                    const eq = l.indexOf('=');
                    if (eq !== -1) {
                      const k = l.substring(0, eq).trim();
                      const v = l.substring(eq + 1).trim();
                      if (k) rawKeyEntries.push({ key: k, val: v });
                    }
                  });
                }

                const keyEntries = rawKeyEntries.filter((item) => {
                  if (!envSearchQuery.trim()) return true;
                  const q = envSearchQuery.toLowerCase();
                  return item.key.toLowerCase().includes(q) || item.val.toLowerCase().includes(q);
                });

                const isEnvExpanded = envSearchQuery.trim().length > 0 ? true : !!expandedEnvFileIds[f.id];

                return (
                  <div 
                    key={f.id} 
                    className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 text-xs space-y-1.5 hover:border-slate-700 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => setExpandedEnvFileIds((prev) => ({ ...prev, [f.id]: !isEnvExpanded }))}
                        className="flex items-center space-x-1.5 cursor-pointer hover:text-amber-300 font-bold text-slate-200 truncate max-w-[170px]"
                      >
                        {isEnvExpanded ? <ChevronDown className="h-3.5 w-3.5 text-amber-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                        <span className="truncate">{f.fileName}</span>
                      </div>
                      <button
                        onClick={() => setFileToDelete({ id: f.id, name: f.fileName })}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete env file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-[10px] font-mono">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {envSearchQuery.trim() ? (
                          <strong className="text-amber-300">Showing {keyEntries.length} / {rawKeyEntries.length} Keys</strong>
                        ) : (
                          <span className="text-slate-500">{rawKeyEntries.length} Keys</span>
                        )}
                      </span>
                      <button
                        onClick={() => onLoadFileToWorkspace(f)}
                        className="px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-sm"
                      >
                        Load Env
                      </button>
                    </div>

                    {/* COLLAPSIBLE PREVIEW OF ENV KEYS */}
                    {isEnvExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider font-mono">
                            Contained Keys ({keyEntries.length}):
                          </span>
                          <span className="text-[9px] text-slate-500 italic">Click key to inspect full value</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto overflow-x-auto custom-scrollbar bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                          {keyEntries.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic">
                              {envSearchQuery ? `No keys match "${envSearchQuery}"` : 'No keys found in file'}
                            </span>
                          ) : (
                            keyEntries.map((entry, idx) => {
                              const isSecretKey = /key|token|secret|pass|auth|jwt|bearer|private|credential|pwd|cert|salt/i.test(entry.key);
                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => setInspectedEnvKey({ fileName: f.fileName, key: entry.key, val: entry.val })}
                                  className="flex items-center justify-between text-[11px] text-slate-300 font-mono p-1 rounded-lg hover:bg-slate-900 cursor-pointer border border-transparent hover:border-slate-800 transition-all"
                                  title="Click to view full un-truncated value"
                                >
                                  <span className="font-bold text-slate-200 break-all pr-2">🔑 {entry.key}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans shrink-0 ${isSecretKey ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                                    {isSecretKey ? '🔒 Secret' : 'Config'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* CONFIRMATION DELETE MODAL PORTAL */}
      {fileToDelete && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-red-900/60 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Delete Collection File</h4>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">{fileToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              How would you like to handle deleting <code className="text-red-300 font-bold">{fileToDelete.name}</code>?
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => confirmDeleteFile('server_only')}
                disabled={deleting}
                className="w-full flex items-center space-x-2 rounded-xl border border-amber-800/80 bg-amber-950/40 p-3 text-xs font-bold text-amber-200 hover:bg-amber-900/60 transition-all text-left"
              >
                <span>☁️ Delete Server Storage File ONLY</span>
                <span className="text-[10px] text-amber-300/70 block font-normal">(Keeps currently loaded collection in Server Cloud workspace pane)</span>
              </button>

              <button
                onClick={() => confirmDeleteFile('both')}
                disabled={deleting}
                className="w-full flex items-center space-x-2 rounded-xl bg-red-600 p-3 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all text-left"
              >
                <span>💥 Delete from BOTH (Server Storage & Cloud Workspace)</span>
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setFileToDelete(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* KEY DETAIL INSPECTOR MODAL PORTAL */}
      {inspectedEnvKey && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Environment Variable Inspector</h4>
                  <p className="text-xs text-slate-400 truncate max-w-[260px]">{inspectedEnvKey.fileName}</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectedEnvKey(null)}
                className="text-slate-400 hover:text-white p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 font-sans mb-1">Variable Key Name:</label>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-amber-300 font-bold select-all break-all">
                  {inspectedEnvKey.key}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 font-sans mb-1">Full Server Value:</label>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-emerald-300 font-mono select-all break-all max-h-48 overflow-y-auto custom-scrollbar">
                  {inspectedEnvKey.val || <span className="text-slate-600 italic">Empty Value</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectedEnvKey(null)}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
