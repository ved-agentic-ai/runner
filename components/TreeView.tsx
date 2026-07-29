'use client';

import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Square, 
  MinusSquare,
  Search,
  Send,
  ChevronsUp,
  ChevronsDown,
  CheckCircle2,
  XCircle,
  Laptop,
  Cloud,
  FileText,
  Info,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  Edit3,
  Copy,
  Plus,
  Download,
  FolderPlus,
  Trash2
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TreeNode, HttpMethod } from '@/lib/types';

export const TreeView: React.FC = () => {
  const { 
    rootNodes, 
    serverRootNodes,
    serverCollectionName,
    activeWorkspaceSource,
    setActiveWorkspaceSource,
    selectedNodeIds, 
    toggleNodeSelection,
    selectAllNodes,
    deselectAllNodes,
    searchQuery,
    setSearchQuery,
    executionResults,
    selectedEndpointIdForDetail,
    setSelectedEndpointIdForDetail,
    maximizedPane,
    toggleMaximizePane,
    updateEndpointName,
    duplicateNode,
    moveNode,
    addFolderNode,
    addEndpointNode,
    deleteNode,
    exportCollection
  } = useRunnerStore();

  const treeScrollRef = React.useRef<HTMLDivElement>(null);
  const [showTreeTopFab, setShowTreeTopFab] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState('');

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [showAddEpModal, setShowAddEpModal] = useState(false);
  const [newEpName, setNewEpName] = useState('');
  const [newEpMethod, setNewEpMethod] = useState<HttpMethod>('GET');
  const [newEpUrl, setNewEpUrl] = useState('https://api.example.com/v1/resource');

  const handleTreeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 80) {
      setShowTreeTopFab(true);
    } else {
      setShowTreeTopFab(false);
    }
  };

  const handleScrollToTop = () => {
    treeScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const activeNodes = (activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0) 
    ? serverRootNodes 
    : rootNodes;

  let infoTotalNodesCount = 0;
  let infoTotalEndpointsCount = 0;
  let infoSelectedEndpointsCount = 0;
  const selSet = new Set(selectedNodeIds);
  function countTreeNodes(list: TreeNode[]) {
    list.forEach((n) => {
      infoTotalNodesCount++;
      if (n.type === 'endpoint') {
        infoTotalEndpointsCount++;
        if (selSet.has(n.id)) infoSelectedEndpointsCount++;
      }
      if (n.children) countTreeNodes(n.children);
    });
  }
  countTreeNodes(activeNodes);

  // Auto-expand all parent ancestor folders leading to selectedEndpointIdForDetail
  useEffect(() => {
    if (!selectedEndpointIdForDetail || activeNodes.length === 0) return;

    const ancestorsToExpand: Record<string, boolean> = {};

    function findAncestors(nodes: TreeNode[], targetId: string, path: string[] = []): boolean {
      for (const node of nodes) {
        if (node.id === targetId) {
          path.forEach((folderId) => {
            ancestorsToExpand[folderId] = true;
          });
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findAncestors(node.children, targetId, [...path, node.id])) {
            return true;
          }
        }
      }
      return false;
    }

    findAncestors(activeNodes, selectedEndpointIdForDetail);

    if (Object.keys(ancestorsToExpand).length > 0) {
      setExpandedFolders((prev) => ({ ...prev, ...ancestorsToExpand }));
    }
  }, [selectedEndpointIdForDetail, activeNodes]);

  const toggleExpand = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const expandAllFolders = () => {
    const allExpanded: Record<string, boolean> = {};
    function walk(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'folder') {
          allExpanded[n.id] = true;
          if (n.children) walk(n.children);
        }
      });
    }
    walk(activeNodes);
    setExpandedFolders(allExpanded);
  };

  const collapseAllFolders = () => {
    const allCollapsed: Record<string, boolean> = {};
    function walk(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'folder') {
          allCollapsed[n.id] = false;
          if (n.children) walk(n.children);
        }
      });
    }
    walk(activeNodes);
    setExpandedFolders(allCollapsed);
  };

  const getNodeCheckState = (node: TreeNode): 'checked' | 'unchecked' | 'indeterminate' => {
    const selectedSet = new Set(selectedNodeIds);

    if (node.type === 'endpoint') {
      return selectedSet.has(node.id) ? 'checked' : 'unchecked';
    }

    if (!node.children || node.children.length === 0) {
      return selectedSet.has(node.id) ? 'checked' : 'unchecked';
    }

    let checkedCount = 0;
    let uncheckedCount = 0;
    let indeterminateCount = 0;

    node.children.forEach((child) => {
      const st = getNodeCheckState(child);
      if (st === 'checked') checkedCount++;
      else if (st === 'unchecked') uncheckedCount++;
      else indeterminateCount++;
    });

    if (checkedCount === node.children.length) return 'checked';
    if (uncheckedCount === node.children.length) return 'unchecked';
    return 'indeterminate';
  };

  const matchedFolderIds = React.useMemo(() => {
    if (!searchQuery) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const folderSet = new Set<string>();

    function matchNode(node: TreeNode, parentFolders: string[] = []): boolean {
      const selfMatch = node.name.toLowerCase().includes(q) || (node.url && node.url.toLowerCase().includes(q));
      let childMatch = false;

      const currentPath = node.type === 'folder' ? [...parentFolders, node.id] : parentFolders;

      if (node.children) {
        node.children.forEach((c) => {
          if (matchNode(c, currentPath)) childMatch = true;
        });
      }

      if (selfMatch || childMatch) {
        parentFolders.forEach((fid) => folderSet.add(fid));
        if (node.type === 'folder') folderSet.add(node.id);
        return true;
      }

      return false;
    }

    activeNodes.forEach((n) => matchNode(n));
    return folderSet;
  }, [searchQuery, activeNodes]);

  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    if (!searchQuery) return nodes;
    const q = searchQuery.toLowerCase();

    return nodes
      .map((node) => {
        const selfMatch = node.name.toLowerCase().includes(q) || (node.url && node.url.toLowerCase().includes(q));
        const filteredChildren = node.children ? filterTree(node.children) : undefined;
        const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

        if (selfMatch || hasMatchingChildren) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeNode[];
  };

  const displayNodes = filterTree(activeNodes);

  function countEndpoints(nodes: TreeNode[]): number {
    let count = 0;
    nodes.forEach((n) => {
      if (n.type === 'endpoint') count += 1;
      if (n.children) count += countEndpoints(n.children);
    });
    return count;
  }

  const selectedEndpointsInTreeCount = React.useMemo(() => {
    let count = 0;
    const selectedSet = new Set(selectedNodeIds);
    function walk(list: TreeNode[]) {
      list.forEach((n) => {
        if (n.type === 'endpoint') {
          if (selectedSet.has(n.id)) count++;
        }
        if (n.children) walk(n.children);
      });
    }
    walk(activeNodes);
    return count;
  }, [activeNodes, selectedNodeIds]);

  const handleSelectAll = () => {
    if (searchQuery.trim()) {
      const idsToSelect: string[] = [];
      function collectIds(nodes: TreeNode[]) {
        nodes.forEach((n) => {
          idsToSelect.push(n.id);
          if (n.children) collectIds(n.children);
        });
      }
      collectIds(displayNodes);
      const newSet = new Set([...selectedNodeIds, ...idsToSelect]);
      useRunnerStore.setState({ selectedNodeIds: Array.from(newSet) });
    } else {
      selectAllNodes();
    }
  };

  const handleDeselectAll = () => {
    if (searchQuery.trim()) {
      const idsToRemove = new Set<string>();
      function collectIds(nodes: TreeNode[]) {
        nodes.forEach((n) => {
          idsToRemove.add(n.id);
          if (n.children) collectIds(n.children);
        });
      }
      collectIds(displayNodes);
      const nextSelected = selectedNodeIds.filter((id) => !idsToRemove.has(id));
      useRunnerStore.setState({ selectedNodeIds: nextSelected });
    } else {
      deselectAllNodes();
    }
  };

  const handleStartRename = (node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditingNodeName(node.name);
  };

  const handleSaveRename = (nodeId: string) => {
    if (editingNodeName.trim()) {
      updateEndpointName(nodeId, editingNodeName.trim());
    }
    setEditingNodeId(null);
  };

  const getMethodBadgeClass = (m?: HttpMethod) => {
    switch (m) {
      case 'GET': return 'bg-emerald-950/80 border-emerald-800 text-emerald-400';
      case 'POST': return 'bg-amber-950/80 border-amber-800 text-amber-400';
      case 'PUT': return 'bg-indigo-950/80 border-indigo-800 text-indigo-400';
      case 'DELETE': return 'bg-red-950/80 border-red-800 text-red-400';
      case 'PATCH': return 'bg-purple-950/80 border-purple-800 text-purple-400';
      default: return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.id] ?? true;
    const checkState = getNodeCheckState(node);
    const result = executionResults[node.id];
    const isSelectedDetail = selectedEndpointIdForDetail === node.id;
    const isEditing = editingNodeId === node.id;

    return (
      <div key={node.id} id={`tree-node-${node.id}`} className="select-none font-mono text-xs transition-all duration-200 group/tree-item">
        <div 
          className={`flex items-center space-x-1.5 rounded-xl px-2 py-1.5 transition-all ${
            isSelectedDetail 
              ? 'bg-amber-950/80 border-2 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/50' 
              : 'hover:bg-slate-800/50 text-slate-300'
          }`}
          style={{ paddingLeft: `${Math.max(0.3, depth * 0.9)}rem` }}
        >
          {/* Collapse Chevron / Folder Toggle */}
          {isFolder ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-0.5 text-slate-400 hover:text-amber-400 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* Selection Checkbox */}
          <button
            onClick={() => toggleNodeSelection(node.id)}
            className="p-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
          >
            {checkState === 'checked' && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-emerald-500 text-slate-950 font-bold">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
            )}
            {checkState === 'indeterminate' && (
              <MinusSquare className="h-3.5 w-3.5 text-emerald-400" />
            )}
            {checkState === 'unchecked' && (
              <Square className="h-3.5 w-3.5 text-slate-600" />
            )}
          </button>

          {/* Node Icon & Method Badge */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={editingNodeName}
                onChange={(e) => setEditingNodeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(node.id); if (e.key === 'Escape') setEditingNodeId(null); }}
                className="flex-1 rounded border border-indigo-500 bg-slate-900 px-2 py-0.5 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleSaveRename(node.id)}
                className="px-2 py-0.5 rounded bg-indigo-600 text-[10px] font-bold text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          ) : isFolder ? (
            <div 
              onClick={() => toggleExpand(node.id)}
              className="flex items-center space-x-1.5 cursor-pointer flex-1 min-w-0"
            >
              {isExpanded ? (
                <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
              )}
              <span className="font-semibold text-slate-200 truncate">{node.name}</span>
            </div>
          ) : (
            <div 
              onClick={() => {
                const storeState = useRunnerStore.getState();

                if (storeState.flatEndpointMap instanceof Map) {
                  storeState.flatEndpointMap.set(node.id, node);
                } else if (storeState.flatEndpointMap) {
                  (storeState.flatEndpointMap as any)[node.id] = node;
                }

                if (storeState.serverFlatEndpointMap instanceof Map) {
                  storeState.serverFlatEndpointMap.set(node.id, node);
                } else if (storeState.serverFlatEndpointMap) {
                  (storeState.serverFlatEndpointMap as any)[node.id] = node;
                }

                if (storeState.selectedEndpointIdForDetail === node.id) {
                  useRunnerStore.setState({ selectedEndpointIdForDetail: null });
                  setTimeout(() => {
                    useRunnerStore.setState({ selectedEndpointIdForDetail: node.id });
                  }, 20);
                } else {
                  setSelectedEndpointIdForDetail(node.id);
                }
              }}
              className="flex items-center space-x-1.5 cursor-pointer flex-1 min-w-0"
              title="Click to open in Workbench"
            >
              <span className={`rounded border px-1 py-0.5 text-[9px] font-extrabold uppercase shrink-0 ${getMethodBadgeClass(node.method)}`}>
                {node.method || 'GET'}
              </span>
              <span className="text-slate-300 truncate hover:text-white transition-colors">{node.name}</span>
            </div>
          )}

          {/* Action Buttons on Hover (Rename, Clone, Move Up/Down) */}
          {!isEditing && (
            <div className="opacity-0 group-hover/tree-item:opacity-100 flex items-center space-x-1 shrink-0 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleStartRename(node); }}
                className="p-0.5 text-slate-400 hover:text-indigo-300 transition-colors"
                title="Rename endpoint"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); duplicateNode(node.id); }}
                className="p-0.5 text-slate-400 hover:text-emerald-300 transition-colors"
                title="Duplicate / Clone endpoint"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'up'); }}
                className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors"
                title="Move up"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'down'); }}
                className="p-0.5 text-slate-400 hover:text-amber-300 transition-colors"
                title="Move down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm(`Delete "${node.name}"?`)) {
                    deleteNode(node.id);
                  }
                }}
                className="p-0.5 text-slate-400 hover:text-red-400 transition-colors"
                title="Delete endpoint or folder"
              >
                <Trash2 className="h-3 w-3 text-red-400/80 hover:text-red-400" />
              </button>
            </div>
          )}

          {/* Execution Result Status Badge */}
          {result && (
            <div className="shrink-0 ml-auto pl-1">
              {result.status === 'passed' && (
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Pass
                </span>
              )}
              {result.status === 'failed' && (
                <span className="inline-flex items-center gap-1 text-[9px] text-red-400 font-semibold bg-red-950/60 px-1.5 py-0.5 rounded-full border border-red-800/60">
                  <XCircle className="h-2.5 w-2.5 text-red-400" /> Fail
                </span>
              )}
            </div>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl relative">
      
      {/* Dual Workspace Selector Tabs */}
      {serverRootNodes.length > 0 && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 mb-3">
          <button
            onClick={() => setActiveWorkspaceSource('local')}
            className={`flex items-center justify-center space-x-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeWorkspaceSource === 'local' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Local Upload ({rootNodes.length})</span>
          </button>
          <button
            onClick={() => setActiveWorkspaceSource('server')}
            className={`flex items-center justify-center space-x-1.5 rounded-lg py-1.5 text-xs font-bold transition-all ${
              activeWorkspaceSource === 'server' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Server Cloud ({serverRootNodes.length})</span>
          </button>
        </div>
      )}

      {/* Search & Collapse Bar Header */}
      <div className="space-y-2.5 pb-3 border-b border-slate-800/80">
        
        {/* Row 1: Section Title & Maximize Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Collection Hierarchy
            </h3>

            {/* Info Icon with Popover Tooltip */}
            <div className="relative group">
              <Info className="h-3.5 w-3.5 text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors" />
              <div className="absolute left-0 top-5 z-50 hidden group-hover:block w-72 p-3 rounded-2xl bg-[#0f172a] border border-indigo-500/40 shadow-2xl space-y-2 text-left text-xs font-sans text-slate-200">
                <div className="font-bold text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>ℹ️ Workspace Status Info</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {activeWorkspaceSource === 'server' ? '☁️ Server Cloud' : '💻 Local File'}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Collection:</span>
                    <strong className="text-white truncate max-w-[130px]">{serverCollectionName || 'Active Workspace'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loaded Endpoints:</span>
                    <strong className="text-emerald-300">{infoTotalEndpointsCount} Endpoints ({infoTotalNodesCount} Nodes)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Checked for Run:</span>
                    <strong className="text-amber-300">{infoSelectedEndpointsCount} Selected</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => toggleMaximizePane('tree')}
              className={`p-1 rounded-lg border transition-all ${
                maximizedPane === 'tree'
                  ? 'border-amber-500 bg-amber-950/60 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={maximizedPane === 'tree' ? 'Minimize Collection Hierarchy (Restore 3-Pane View)' : 'Maximize Collection Hierarchy (Focus View)'}
            >
              {maximizedPane === 'tree' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Row 2: Action Controls Bar (No Text Overflow in 3-Pane View) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1-Click Collapse All */}
            <button
              type="button"
              onClick={collapseAllFolders}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-amber-400 font-semibold transition-colors"
              title="Collapse All Folders"
            >
              <ChevronsUp className="h-3.5 w-3.5 text-amber-400" />
              <span>Collapse</span>
            </button>
            
            <span className="text-slate-700">|</span>

            {/* 1-Click Expand All */}
            <button
              type="button"
              onClick={expandAllFolders}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-400 font-semibold transition-colors"
              title="Expand All Folders"
            >
              <ChevronsDown className="h-3.5 w-3.5 text-indigo-400" />
              <span>Expand</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              type="button"
              onClick={handleSelectAll}
              className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
              title="Select all endpoints"
            >
              All
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-400 hover:text-slate-200 font-bold hover:underline"
              title="Deselect all endpoints"
            >
              None
            </button>
          </div>

          {/* Collection Export & Add Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => exportCollection(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 text-[10px] font-bold"
              title="Export Full Collection as Postman JSON"
            >
              <Download className="h-3 w-3 text-indigo-400" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddEpModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold"
              title="Add new Endpoint"
            >
              <Plus className="h-3 w-3 text-emerald-400" />
              <span>+ EP</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddFolderModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 hover:bg-amber-900 text-[10px] font-bold"
              title="Add new Folder"
            >
              <FolderPlus className="h-3 w-3 text-amber-400" />
              <span>+ Folder</span>
            </button>
          </div>
        </div>

        {/* Selected Count Indicator Badge */}
        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              <strong className="text-emerald-400">{selectedEndpointsInTreeCount}</strong> / {infoTotalEndpointsCount} endpoints selected for run
            </span>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter endpoints or methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

      </div>

      {/* ── TREE NODES VIEWPORT ──────────────────────────────────────────────── */}
      <div 
        ref={treeScrollRef}
        onScroll={handleTreeScroll}
        className="flex-1 overflow-y-auto custom-scrollbar pt-3 space-y-1 relative"
      >
        {displayNodes.length > 0 ? (
          displayNodes.map((node) => renderNode(node))
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
            <p>No endpoints found matching &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-indigo-400 hover:underline font-bold"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Floating Top FAB */}
      {showTreeTopFab && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="absolute bottom-5 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all border border-indigo-400/60 animate-in fade-in zoom-in duration-200"
          title="Scroll tree to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── ADD FOLDER MODAL ────────────────────────────────────────────────── */}
      {showAddFolderModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl p-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-amber-400" /> Create New Folder
            </h4>
            <input
              type="text"
              placeholder="Folder Name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (newFolderName.trim()) addFolderNode(null, newFolderName.trim());
                  setNewFolderName('');
                  setShowAddFolderModal(false);
                }}
                className="flex-1 rounded-xl bg-amber-600 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddFolderModal(false)}
                className="flex-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ENDPOINT MODAL ──────────────────────────────────────────────── */}
      {showAddEpModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-2xl p-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" /> Create New Endpoint
            </h4>
            <input
              type="text"
              placeholder="Endpoint Name..."
              value={newEpName}
              onChange={(e) => setNewEpName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <select
                value={newEpMethod}
                onChange={(e) => setNewEpMethod(e.target.value as HttpMethod)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white font-mono"
              >
                {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="text"
                placeholder="https://..."
                value={newEpUrl}
                onChange={(e) => setNewEpUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (newEpName.trim()) addEndpointNode(null, newEpName.trim(), newEpMethod, newEpUrl);
                  setNewEpName('');
                  setShowAddEpModal(false);
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowAddEpModal(false)}
                className="flex-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
