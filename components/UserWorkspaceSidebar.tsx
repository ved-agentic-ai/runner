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
  Search,
  Info,
  Maximize2,
  Minimize2,
  ArrowUp
} from 'lucide-react';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { useAdminStore } from '@/lib/admin-store';
import { useRunnerStore } from '@/lib/store';
import { parseAndNormalizeServerCollection } from '@/lib/collection-parser';
import { TreeNode } from '@/lib/types';

interface UserWorkspaceSidebarProps {
  onLoadFileToWorkspace: (file: any) => void;
  refreshTrigger?: number;
  loadedFileId?: string | null;
  loadedEnvFileId?: string | null;
  onResetLoadedFileId?: () => void;
  onResetLoadedEnvFileId?: () => void;
  onRegisterReopenRef?: (fn: (fileRecord: any) => void) => void;
}

export const UserWorkspaceSidebar: React.FC<UserWorkspaceSidebarProps> = ({
  onLoadFileToWorkspace,
  refreshTrigger,
  loadedFileId,
  loadedEnvFileId,
  onResetLoadedFileId,
  onResetLoadedEnvFileId,
  onRegisterReopenRef
}) => {
  const { user, isAuthenticated } = useUserAuthStore();
  const { serverStoragePaused } = useAdminStore();
  const setSelectedEndpointIdForDetail = useRunnerStore((s) => s.setSelectedEndpointIdForDetail);

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null);
  const [showSidebarTopFab, setShowSidebarTopFab] = useState(false);

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 80) {
      setShowSidebarTopFab(true);
    } else {
      setShowSidebarTopFab(false);
    }
  };

  const handleScrollToTop = () => {
    sidebarScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [envExpanded, setEnvExpanded] = useState(true);
  
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
  // Per-env-file selection state for env keys
  const [selectedSidebarEnvKeys, setSelectedSidebarEnvKeys] = useState<Record<string, Set<string>>>({});

  // Custom load confirmation modal state
  const [pendingLoadConfirm, setPendingLoadConfirm] = useState<{
    file: any;
    fileType: 'collection' | 'env';
    totalCount: number;
    selectedCount: number;
    selectedIdsOrKeys: string[];
  } | null>(null);

  // Custom Delete Modal State
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inspected Environment Key Details Modal State
  const [inspectedEnvKey, setInspectedEnvKey] = useState<{ fileName: string; key: string; val: string } | null>(null);

  useEffect(() => {
    if (onRegisterReopenRef) {
      onRegisterReopenRef((fileRecord: any) => {
        if (fileRecord) {
          const origCount = fileRecord.originalSelectedCount ?? fileRecord.selectedCount ?? 0;
          const origKeys = fileRecord.originalSelectedIdsOrKeys ?? fileRecord.selectedIdsOrKeys ?? [];
          setPendingLoadConfirm({
            file: fileRecord,
            fileType: fileRecord.fileType === 'collection' ? 'collection' : 'env',
            totalCount: fileRecord.totalCount || 0,
            selectedCount: origCount,
            selectedIdsOrKeys: origKeys
          });
        }
      });
    }
  }, [onRegisterReopenRef]);

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

    function walk(list: TreeNode[]): TreeNode[] {
      const result: TreeNode[] = [];
      list.forEach((node) => {
        if (node.type === 'folder') {
          const sub = walk(node.children || []);
          if (sub.length > 0) {
            result.push({ ...node, children: sub });
          }
        } else {
          const nameMatch = node.name ? node.name.toLowerCase().includes(q) : false;
          const methodMatch = node.method ? node.method.toLowerCase().includes(q) : false;
          const urlMatch = node.url ? node.url.toLowerCase().includes(q) : false;
          if (nameMatch || methodMatch || urlMatch) {
            result.push(node);
          }
        }
      });
      return result;
    }

    return walk(nodes);
  }

  const handleEndpointClick = (node: TreeNode) => {
    // Ensure node is registered in both Zustand store flatEndpointMaps so EndpointWorkbench & DetailSheet open cleanly
    const state = useRunnerStore.getState();
    if (state.flatEndpointMap && typeof state.flatEndpointMap.set === 'function') {
      state.flatEndpointMap.set(node.id, node);
    }
    if (state.serverFlatEndpointMap && typeof state.serverFlatEndpointMap.set === 'function') {
      state.serverFlatEndpointMap.set(node.id, node);
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
    <div className="w-full max-w-full h-[750px] max-h-[80vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-xl overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center space-x-2">
          <Folder className="h-4 w-4 text-indigo-400" />
          <h3 className="font-bold text-xs text-white">Server Workspace Explorer</h3>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">

          <button
            type="button"
            onClick={() => useRunnerStore.getState().toggleMaximizePane('sidebar')}
            className={`p-1 rounded-lg border transition-all ${
              useRunnerStore.getState().maximizedPane === 'sidebar'
                ? 'border-amber-500 bg-amber-950/60 text-amber-300 shadow-md shadow-amber-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title={useRunnerStore.getState().maximizedPane === 'sidebar' ? 'Minimize Server Explorer (Restore 3-Pane View)' : 'Maximize Server Explorer (Focus View)'}
          >
            {useRunnerStore.getState().maximizedPane === 'sidebar' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={fetchUserFiles}
            className="p-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all"
            title="Refresh server files"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div ref={sidebarScrollRef} onScroll={handleSidebarScroll} className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 relative">

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
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900">
          <div 
            onClick={() => setCollectionsExpanded(!collectionsExpanded)}
            className="flex items-center space-x-2 text-xs font-bold text-indigo-300 cursor-pointer"
          >
            {collectionsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <FileCode className="h-4 w-4 text-indigo-400" />
            <span>
              API Collections ({collections.length}
              {collectionSearchQuery.trim() && ` / ${files.filter((f) => f.fileType === 'collection').length}`}
              )
            </span>
          </div>

          {/* Info Icon with Popover Tooltip */}
          <div className="relative group">
            <Info className="h-3.5 w-3.5 text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors" />
            <div className="absolute right-0 top-5 z-50 hidden group-hover:block w-72 p-3 rounded-2xl bg-[#0f172a] border border-indigo-500/40 shadow-2xl space-y-2 text-left text-xs font-sans text-slate-200">
              <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>ℹ️ Server Collections Info</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Total: {collections.length}
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Collection File:</span>
                  <strong className="text-emerald-300 truncate max-w-[130px]">
                    {files.find((f) => f.id === loadedFileId)?.fileName || 'None'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Search Filter:</span>
                  <strong className="text-indigo-300">{collectionSearchQuery ? `"${collectionSearchQuery}"` : 'None'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {collectionsExpanded && (
          <div className="pl-1 space-y-2 pt-1">
            {/* Dedicated Collection Search Bar + Reset */}
            <div className="flex items-center space-x-1.5 mb-2">
              <div className="relative flex-1">
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
              <button
                type="button"
                onClick={() => {
                  setCollectionSearchQuery('');
                  setSelectedSidebarNodeIds({});
                  if (onResetLoadedFileId) onResetLoadedFileId();
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white transition-all shrink-0"
                title="Reset collection search filter, selections, and card active status"
              >
                Reset
              </button>
            </div>

            {collections.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">
                {collectionSearchQuery ? `No collections match "${collectionSearchQuery}".` : 'No collections saved on server.'}
              </p>
            ) : (
              collections.map((f) => {
                const { rootNodes: sidebarTree, allNodeIds, totalEndpoints } = parseSidebarTreeNodes(f.content, f.fileName);
                const displaySidebarTree = filterSidebarNodes(sidebarTree, collectionSearchQuery);
                const isTreeExpanded = expandedFileTreeIds[f.id] ?? (collectionSearchQuery.trim().length > 0);

                function getFilteredEndpointIds(nodes: TreeNode[]): string[] {
                  const ids: string[] = [];
                  function walk(list: TreeNode[]) {
                    list.forEach((n) => {
                      if (n.type === 'endpoint') ids.push(n.id);
                      if (n.children) walk(n.children);
                    });
                  }
                  walk(nodes);
                  return ids;
                }
                const searchMatchedEndpointIds = getFilteredEndpointIds(displaySidebarTree);

                const manualSet = selectedSidebarNodeIds[f.id];
                const fileSelectedSet = collectionSearchQuery.trim() 
                  ? new Set(searchMatchedEndpointIds) 
                  : (manualSet !== undefined ? manualSet : new Set(allNodeIds));

                function countSidebarStats(nodes: TreeNode[]): { nodes: number; endpoints: number; selectedEndpoints: number } {
                  let nCnt = 0;
                  let eCnt = 0;
                  let selCnt = 0;
                  function walk(list: TreeNode[]) {
                    list.forEach((n) => {
                      nCnt++;
                      if (n.type === 'endpoint') {
                        eCnt++;
                        if (fileSelectedSet.has(n.id)) selCnt++;
                      }
                      if (n.children) walk(n.children);
                    });
                  }
                  walk(nodes);
                  return { nodes: nCnt, endpoints: eCnt, selectedEndpoints: selCnt };
                }

                const displayStats = countSidebarStats(sidebarTree);
                const isCustomizedSelection = fileSelectedSet.size < totalEndpoints;

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
                        <span className="font-bold text-slate-200 truncate max-w-[150px]" title={f.fileName}>{f.fileName}</span>
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
                              setPendingLoadConfirm({
                                file: f,
                                fileType: 'collection',
                                totalCount: totalEndpoints,
                                selectedCount: displayStats.selectedEndpoints,
                                selectedIdsOrKeys: Array.from(fileSelectedSet)
                              });
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

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(f.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {manualSet && manualSet.size > 0 && isCustomizedSelection ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                            Selected: {displayStats.selectedEndpoints} / {totalEndpoints} Endpoints
                          </span>
                        ) : collectionSearchQuery.trim() ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold animate-in fade-in">
                            🔍 Filter Active: {displayStats.selectedEndpoints} / {totalEndpoints} Endpoints
                          </span>
                        ) : (
                          <span className="font-bold text-slate-300">
                            {allNodeIds.length} Nodes ({totalEndpoints} Endpoints)
                          </span>
                        )}
                      </div>
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
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900">
          <div 
            onClick={() => setEnvExpanded(!envExpanded)}
            className="flex items-center space-x-2 text-xs font-bold text-amber-300 cursor-pointer"
          >
            {envExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Key className="h-4 w-4 text-amber-400" />
            <span>
              Environment Files ({envFiles.length}
              {envSearchQuery.trim() && ` / ${files.filter((f) => f.fileType === 'env').length}`}
              )
            </span>
          </div>

          {/* Info Icon with Popover Tooltip */}
          <div className="relative group">
            <Info className="h-3.5 w-3.5 text-amber-400 cursor-pointer hover:text-amber-300 transition-colors" />
            <div className="absolute right-0 top-5 z-50 hidden group-hover:block w-72 p-3 rounded-2xl bg-[#0f172a] border border-amber-500/40 shadow-2xl space-y-2 text-left text-xs font-sans text-slate-200">
              <div className="font-bold text-amber-300 border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>ℹ️ Environment Files Info</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Total: {envFiles.length}
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Env File:</span>
                  <strong className="text-emerald-300 truncate max-w-[130px]">
                    {files.find((f) => f.id === loadedEnvFileId)?.fileName || 'None'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Search Filter:</span>
                  <strong className="text-amber-300">{envSearchQuery ? `"${envSearchQuery}"` : 'None'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {envExpanded && (
          <div className="pl-1 space-y-2 pt-1">
            {/* Dedicated Environment Search Bar + Reset */}
            <div className="flex items-center space-x-1.5 mb-2">
              <div className="relative flex-1">
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
              <button
                type="button"
                onClick={() => {
                  setEnvSearchQuery('');
                  setSelectedSidebarEnvKeys({});
                  if (onResetLoadedEnvFileId) onResetLoadedEnvFileId();
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-all shrink-0"
                title="Reset environment search filter, custom key selections, and card active status"
              >
                Reset
              </button>
            </div>

            {envFiles.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-3 py-1">
                {envSearchQuery ? `No .env files match "${envSearchQuery}".` : 'No .env files saved on server.'}
              </p>
            ) : (
              envFiles.map((f) => {
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

                const allKeys = rawKeyEntries.map((e) => e.key);
                const keyEntries = rawKeyEntries.filter((item) => {
                  if (!envSearchQuery.trim()) return true;
                  const q = envSearchQuery.toLowerCase();
                  return item.key.toLowerCase().includes(q) || item.val.toLowerCase().includes(q);
                });
                const searchMatchedEnvKeys = keyEntries.map((e) => e.key);

                const hasUserManualEnvSelection = !!selectedSidebarEnvKeys[f.id];
                const manualEnvSet = selectedSidebarEnvKeys[f.id];
                const selectedKeySet = envSearchQuery.trim()
                  ? new Set(searchMatchedEnvKeys)
                  : (manualEnvSet !== undefined ? manualEnvSet : new Set(allKeys));

                const isCustomEnvSelection = selectedKeySet.size < rawKeyEntries.length;

                const isEnvExpanded = expandedEnvFileIds[f.id] ?? (envSearchQuery.trim().length > 0);

                const toggleEnvKey = (keyName: string) => {
                  const currentSet = new Set(selectedSidebarEnvKeys[f.id] || allKeys);
                  if (currentSet.has(keyName)) {
                    currentSet.delete(keyName);
                  } else {
                    currentSet.add(keyName);
                  }
                  setSelectedSidebarEnvKeys((prev) => ({ ...prev, [f.id]: new Set(currentSet) }));
                };

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
                        type="button"
                        onClick={() => setFileToDelete({ id: f.id, name: f.fileName })}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete env file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
                      <span className="flex items-center gap-1 text-[10px] font-mono">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {hasUserManualEnvSelection && isCustomEnvSelection ? (
                          <strong className="text-amber-300 font-bold">Selected: {selectedKeySet.size} / {rawKeyEntries.length} Keys</strong>
                        ) : envSearchQuery.trim() ? (
                          <strong className="text-amber-300 font-bold animate-in fade-in">🔍 Filter Active: {selectedKeySet.size} / {rawKeyEntries.length} Keys</strong>
                        ) : (
                          <span className="text-slate-500">{rawKeyEntries.length} Keys</span>
                        )}
                      </span>

                      {loadedEnvFileId === f.id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingLoadConfirm({
                              file: f,
                              fileType: 'env',
                              totalCount: rawKeyEntries.length,
                              selectedCount: selectedKeySet.size,
                              selectedIdsOrKeys: Array.from(selectedKeySet)
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-600 text-white hover:bg-amber-500 transition-all shadow-sm"
                        >
                          Load Env
                        </button>
                      )}
                    </div>

                    {/* COLLAPSIBLE PREVIEW OF ENV KEYS WITH SELECTION CHECKBOXES */}
                    {isEnvExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="uppercase font-bold text-amber-400 block tracking-wider">
                            Contained Keys ({keyEntries.length}):
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSidebarEnvKeys((prev) => ({ ...prev, [f.id]: new Set(allKeys) }))}
                              className="text-indigo-400 hover:underline font-bold"
                            >
                              All
                            </button>
                            <span className="text-slate-600">|</span>
                            <button
                              type="button"
                              onClick={() => setSelectedSidebarEnvKeys((prev) => ({ ...prev, [f.id]: new Set() }))}
                              className="text-slate-400 hover:underline font-bold"
                            >
                              None
                            </button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto overflow-x-auto custom-scrollbar bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                          {keyEntries.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic">
                              {envSearchQuery ? `No keys match "${envSearchQuery}"` : 'No keys found in file'}
                            </span>
                          ) : (
                            keyEntries.map((entry, idx) => {
                              const isSecretKey = /key|token|secret|pass|auth|jwt|bearer|private|credential|pwd|cert|salt/i.test(entry.key);
                              const isChecked = selectedKeySet.has(entry.key);

                              return (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between text-[11px] text-slate-300 font-mono p-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all select-none"
                                >
                                  <div className="flex items-center space-x-1.5 min-w-0 pr-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleEnvKey(entry.key)}
                                      className="text-amber-400 shrink-0 p-0.5"
                                    >
                                      {isChecked ? <CheckSquare className="h-3.5 w-3.5 text-emerald-400" /> : <Square className="h-3.5 w-3.5 text-slate-600" />}
                                    </button>
                                    <span 
                                      onClick={() => setInspectedEnvKey({ fileName: f.fileName, key: entry.key, val: entry.val })}
                                      className={`font-bold cursor-pointer truncate ${isChecked ? 'text-slate-200 hover:text-amber-300' : 'text-slate-500 line-through'}`}
                                      title="Click to view full value"
                                    >
                                      🔑 {entry.key}
                                    </span>
                                  </div>

                                  <span 
                                    onClick={() => setInspectedEnvKey({ fileName: f.fileName, key: entry.key, val: entry.val })}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-sans shrink-0 cursor-pointer ${isSecretKey ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                                  >
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

      {/* CUSTOM LOAD CONFIRMATION INTERACTIVE MODAL PORTAL */}
      {pendingLoadConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-indigo-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Load {pendingLoadConfirm.fileType === 'collection' ? 'Custom Selected Endpoints' : 'Custom Selected Variables'}
                  </h4>
                  <p className="text-[11px] text-slate-400">Interactive Load Selection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingLoadConfirm(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                You have custom-selected <strong className="text-amber-300 font-mono font-extrabold">{pendingLoadConfirm.selectedCount}</strong> out of <strong className="text-slate-200 font-mono">{pendingLoadConfirm.totalCount}</strong> {pendingLoadConfirm.fileType === 'collection' ? 'endpoints' : 'variables'} from:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-indigo-300 break-all">
                📄 {pendingLoadConfirm.file.fileName}
              </div>
              <p className="text-[11px] text-slate-400">
                How would you like to load this file into your workspace memory?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPendingLoadConfirm(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
                title="Return to Server Explorer to adjust your selected checkboxes"
              >
                <span>🔙 Back / Modify Selection</span>
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingLoadConfirm.fileType === 'collection') {
                      onLoadFileToWorkspace({
                        ...pendingLoadConfirm.file,
                        fromCustomConfirm: true,
                        totalCount: pendingLoadConfirm.totalCount,
                        selectedCount: pendingLoadConfirm.totalCount,
                        selectedIdsOrKeys: [],
                        originalSelectedCount: pendingLoadConfirm.selectedCount,
                        originalSelectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        selectedNodeIds: undefined
                      });
                    } else {
                      onLoadFileToWorkspace({
                        ...pendingLoadConfirm.file,
                        fromCustomConfirm: true,
                        totalCount: pendingLoadConfirm.totalCount,
                        selectedCount: pendingLoadConfirm.totalCount,
                        selectedIdsOrKeys: [],
                        originalSelectedCount: pendingLoadConfirm.selectedCount,
                        originalSelectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        selectedEnvKeys: undefined
                      });
                    }
                    setPendingLoadConfirm(null);
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Load All ({pendingLoadConfirm.totalCount})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pendingLoadConfirm.fileType === 'collection') {
                      onLoadFileToWorkspace({
                        ...pendingLoadConfirm.file,
                        fromCustomConfirm: true,
                        totalCount: pendingLoadConfirm.totalCount,
                        selectedCount: pendingLoadConfirm.selectedCount,
                        selectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        originalSelectedCount: pendingLoadConfirm.selectedCount,
                        originalSelectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        selectedNodeIds: pendingLoadConfirm.selectedIdsOrKeys
                      });
                    } else {
                      onLoadFileToWorkspace({
                        ...pendingLoadConfirm.file,
                        fromCustomConfirm: true,
                        totalCount: pendingLoadConfirm.totalCount,
                        selectedCount: pendingLoadConfirm.selectedCount,
                        selectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        originalSelectedCount: pendingLoadConfirm.selectedCount,
                        originalSelectedIdsOrKeys: pendingLoadConfirm.selectedIdsOrKeys,
                        selectedEnvKeys: pendingLoadConfirm.selectedIdsOrKeys
                      });
                    }
                    setPendingLoadConfirm(null);
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:from-amber-400 hover:to-indigo-500 transition-all"
                >
                  ⚡ Load Selected Only ({pendingLoadConfirm.selectedCount})
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      </div>

      {/* Floating Scroll-to-Top FAB — positioned relative to outer container, visible above overflow */}
      {showSidebarTopFab && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="absolute bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all border border-indigo-400/60 animate-in fade-in zoom-in duration-200"
          title="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

    </div>
  );
};
