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
  Info
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
    setSelectedEndpointIdForDetail
  } = useRunnerStore();

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

  // Auto-expand all parent ancestor folders leading to selectedEndpointIdForDetail & smooth animated scroll into view
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

    // Smooth animated scroll to highlighted node element
    setTimeout(() => {
      const targetElement = document.getElementById(`tree-node-${selectedEndpointIdForDetail}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }, [selectedEndpointIdForDetail, activeNodes]);

  // 1-Click Collapse All
  const collapseAllFolders = () => {
    const nextState: Record<string, boolean> = {};
    function setAllFalse(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'folder') {
          nextState[n.id] = false;
          if (n.children) setAllFalse(n.children);
        }
      });
    }
    setAllFalse(activeNodes);
    setExpandedFolders(nextState);
  };

  // 1-Click Expand All
  const expandAllFolders = () => {
    const nextState: Record<string, boolean> = {};
    function setAllTrue(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'folder') {
          nextState[n.id] = true;
          if (n.children) setAllTrue(n.children);
        }
      });
    }
    setAllTrue(activeNodes);
    setExpandedFolders(nextState);
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !(prev[folderId] ?? true), // Default open if un-tracked
    }));
  };

  const getNodeCheckState = (node: TreeNode): 'checked' | 'unchecked' | 'indeterminate' => {
    if (node.type === 'endpoint') {
      return selectedNodeIds.includes(node.id) ? 'checked' : 'unchecked';
    }

    if (!node.children || node.children.length === 0) {
      return selectedNodeIds.includes(node.id) ? 'checked' : 'unchecked';
    }

    let checkedCount = 0;
    let totalCount = node.children.length;

    node.children.forEach((child) => {
      const childState = getNodeCheckState(child);
      if (childState === 'checked') checkedCount++;
      else if (childState === 'indeterminate') checkedCount += 0.5;
    });

    if (checkedCount === totalCount) return 'checked';
    if (checkedCount > 0) return 'indeterminate';
    return 'unchecked';
  };

  const getMethodBadgeClass = (method?: HttpMethod) => {
    switch (method) {
      case 'GET': return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      case 'POST': return 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60';
      case 'PUT': return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      case 'DELETE': return 'bg-red-950/80 text-red-400 border-red-800/60';
      case 'PATCH': return 'bg-purple-950/80 text-purple-400 border-purple-800/60';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Recursive tree filtering for both folder-level search and endpoint-level matching
  function filterNodesRecursively(
    nodes: TreeNode[],
    query: string
  ): { filtered: TreeNode[]; matchedFolderIds: Set<string> } {
    const q = query.trim().toLowerCase();
    if (!q) return { filtered: nodes, matchedFolderIds: new Set() };

    const matchedFolderIds = new Set<string>();

    function walk(list: TreeNode[], parentFolderNameMatched = false): TreeNode[] {
      const result: TreeNode[] = [];

      list.forEach((node) => {
        if (node.type === 'folder') {
          const folderNameMatches = node.name.toLowerCase().includes(q);
          const childrenMatched = walk(node.children || [], parentFolderNameMatched || folderNameMatches);

          if (childrenMatched.length > 0 || folderNameMatches) {
            matchedFolderIds.add(node.id);
            result.push({
              ...node,
              children: childrenMatched
            });
          }
        } else {
          const nameMatch = node.name.toLowerCase().includes(q);
          const methodMatch = node.method?.toLowerCase().includes(q);
          const urlMatch = node.url?.toLowerCase().includes(q);

          if (nameMatch || methodMatch || urlMatch || parentFolderNameMatched) {
            result.push(node);
          }
        }
      });

      return result;
    }

    return { filtered: walk(nodes), matchedFolderIds };
  }

  const { filtered: displayNodes, matchedFolderIds } = filterNodesRecursively(activeNodes, searchQuery);

  function countEndpoints(nodes: TreeNode[]): number {
    let count = 0;
    nodes.forEach((n) => {
      if (n.type === 'endpoint') count += 1;
      if (n.children) count += countEndpoints(n.children);
    });
    return count;
  }

  const matchedEndpointsCount = countEndpoints(displayNodes);
  const totalEndpointsCount = countEndpoints(activeNodes);

  function countSelectedEndpointsInTree(nodes: TreeNode[]): number {
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
    walk(nodes);
    return count;
  }

  const selectedEndpointsInTreeCount = countSelectedEndpointsInTree(activeNodes);
  const selectedMatchedEndpointsCount = countSelectedEndpointsInTree(displayNodes);

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

  // Auto-expand matched folders when searching
  useEffect(() => {
    if (searchQuery && matchedFolderIds.size > 0) {
      const toExpand: Record<string, boolean> = {};
      matchedFolderIds.forEach((id) => { toExpand[id] = true; });
      setExpandedFolders((prev) => ({ ...prev, ...toExpand }));
    }
  }, [searchQuery, matchedFolderIds.size]);

  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.id] ?? true;
    const checkState = getNodeCheckState(node);
    const result = executionResults[node.id];
    const isSelectedDetail = selectedEndpointIdForDetail === node.id;

    return (
      <div key={node.id} id={`tree-node-${node.id}`} className="select-none font-mono text-xs transition-all duration-200">
        <div 
          className={`flex items-center space-x-2 rounded-xl px-2.5 py-1.5 transition-all ${
            isSelectedDetail 
              ? 'bg-amber-950/80 border-2 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/50 animate-pulse' 
              : 'hover:bg-slate-800/50 text-slate-300'
          }`}
          style={{ paddingLeft: `${Math.max(0.5, depth * 1.2)}rem` }}
        >
          {/* Collapse Chevron / Folder Toggle */}
          {isFolder ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-0.5 text-slate-400 hover:text-amber-400 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Selection Checkbox */}
          <button
            onClick={() => toggleNodeSelection(node.id)}
            className="p-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
          >
            {checkState === 'checked' && (
              <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-slate-950 font-bold">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}
            {checkState === 'indeterminate' && (
              <MinusSquare className="h-4 w-4 text-emerald-400" />
            )}
            {checkState === 'unchecked' && (
              <Square className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Node Icon & Method Badge */}
          {isFolder ? (
            <div 
              onClick={() => toggleExpand(node.id)}
              className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0"
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-amber-500/80 shrink-0" />
              )}
              <span className="font-semibold text-slate-200 truncate">{node.name}</span>
            </div>
          ) : (
            <div 
              onClick={() => setSelectedEndpointIdForDetail(node.id)}
              className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0"
              title="Click to view detailed request spec"
            >
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${getMethodBadgeClass(node.method)}`}>
                {node.method || 'GET'}
              </span>
              <span className="text-slate-300 truncate hover:text-white transition-colors">{node.name}</span>
            </div>
          )}

          {/* Execution Result Status Badge */}
          {result && (
            <div className="shrink-0 ml-auto pl-2">
              {result.status === 'passed' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Pass
                </span>
              )}
              {result.status === 'failed' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/60">
                  <XCircle className="h-3 w-3 text-red-400" /> Fail
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
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl">
      
      {/* Dual Workspace Selector Tabs (Local Upload vs Server Cloud) */}
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
      <div className="space-y-2 pb-3 border-b border-slate-800/80">
        {/* Row 1: Section Title & Controls */}
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
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Search Filter:</span>
                    <strong className="text-indigo-300">{searchQuery ? `"${searchQuery}"` : 'None'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] font-mono shrink-0">
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
              title={searchQuery.trim() ? 'Select all matching search endpoints' : 'Select all endpoints'}
            >
              All
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-400 hover:text-slate-200 font-bold hover:underline"
              title={searchQuery.trim() ? 'Deselect all matching search endpoints' : 'Deselect all endpoints'}
            >
              None
            </button>
          </div>
        </div>

        {/* Row 2: Dynamic Status / Search Badge */}
        <div>
          {searchQuery.trim() ? (
            <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/80 font-mono text-[11px] font-bold shadow-sm animate-in fade-in">
              🔍 {matchedEndpointsCount} search matches ({selectedMatchedEndpointsCount} selected)
            </div>
          ) : (
            <div className="inline-flex items-center px-2.5 py-1 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-mono text-[11px] font-bold shadow-sm">
              ☑️ {selectedEndpointsInTreeCount} / {totalEndpointsCount} endpoints selected for run
            </div>
          )}
        </div>
      </div>

      {/* Filter Input */}
      <div className="relative my-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter endpoints or methods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Tree Content Area with Horizontal & Vertical Scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 space-y-0.5 custom-scrollbar min-w-0">
        {activeNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
            <Send className="h-8 w-8 text-slate-700 stroke-1" />
            <p className="text-xs">No collection loaded yet.</p>
            <p className="text-[11px] text-slate-600 max-w-xs">
              Upload a Postman Collection JSON above.
            </p>
          </div>
        ) : displayNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 space-y-1">
            <p className="text-xs font-bold text-amber-400">No matching endpoints found</p>
            <p className="text-[11px] text-slate-600">No endpoints or folders match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="min-w-max">
            {displayNodes.map((node) => renderNode(node, 0))}
          </div>
        )}
      </div>
    </div>
  );
};
