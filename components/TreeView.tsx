'use client';

import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  MinusSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TreeNode, HttpMethod } from '@/lib/types';
import { AiTestBadge } from './AiTestBadge';

export const TreeView: React.FC = () => {
  const { 
    rootNodes, 
    selectedNodeIds, 
    toggleNodeSelection, 
    selectAllNodes, 
    deselectAllNodes,
    generatedTestSuites,
    executionResults,
    searchQuery,
    setSearchQuery,
    setSelectedEndpointIdForDetail
  } = useRunnerStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'node-1-folder': true,
    'node-2-folder': true,
    'node-3-folder': true,
  });

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Helper to check folder check state (Checked, Indeterminate, Unchecked)
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

  // Method Badge color helper
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

  // Recursive Tree Node Renderer
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[node.id] ?? true; // Default expanded
    const checkState = getNodeCheckState(node);
    const result = executionResults[node.id];
    const testSuite = generatedTestSuites[node.id];

    // Filter check
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const matches = node.name.toLowerCase().includes(query) || (node.url && node.url.toLowerCase().includes(query));
      if (!matches && !isFolder) return null;
    }

    return (
      <div key={node.id} className="select-none">
        <div 
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs transition-colors hover:bg-slate-800/60 ${
            result?.status === 'running' ? 'bg-indigo-950/30' : ''
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* Expand Arrow for Folders */}
            {isFolder ? (
              <button 
                onClick={() => toggleExpand(node.id)}
                className="p-0.5 text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {/* Checkbox */}
            <button
              onClick={() => toggleNodeSelection(node.id)}
              className="text-slate-400 hover:text-indigo-400 transition-colors"
            >
              {checkState === 'checked' && (
                <CheckSquare className="h-4 w-4 text-indigo-400 fill-indigo-500/20" />
              )}
              {checkState === 'unchecked' && (
                <Square className="h-4 w-4 text-slate-600 hover:text-slate-400" />
              )}
              {checkState === 'indeterminate' && (
                <MinusSquare className="h-4 w-4 text-purple-400" />
              )}
            </button>

            {/* Icon */}
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-amber-400 shrink-0" />
              )
            ) : (
              <span className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold ${getMethodBadgeClass(node.method)}`}>
                {node.method}
              </span>
            )}

            {/* Node Name */}
            <span 
              onClick={() => {
                if (isFolder) toggleExpand(node.id);
                else setSelectedEndpointIdForDetail(node.id);
              }}
              className={`truncate font-medium cursor-pointer ${
                isFolder ? 'text-slate-200 hover:text-white' : 'text-slate-300 hover:text-indigo-300'
              }`}
            >
              {node.name}
            </span>

            {/* AI Test Badge */}
            {!isFolder && (
              <AiTestBadge testSuite={testSuite} nodeName={node.name} />
            )}
          </div>

          {/* Status Badge (Execution Result) */}
          {result && (
            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
              {result.status === 'running' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-semibold animate-pulse">
                  <Clock className="h-3 w-3 animate-spin" /> Running
                </span>
              )}
              {result.status === 'passed' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {result.responseTimeMs}ms
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

        {/* Render Folder Children */}
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
      {/* Search Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Collection Hierarchy
        </h3>
        <div className="flex items-center space-x-1 text-[11px]">
          <button
            onClick={selectAllNodes}
            className="text-indigo-400 hover:underline font-medium"
          >
            Select All
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={deselectAllNodes}
            className="text-slate-400 hover:underline"
          >
            Deselect
          </button>
        </div>
      </div>

      {/* Filter Input */}
      <div className="relative mt-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter endpoints or methods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Tree Content */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-[320px]">
        {rootNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-slate-500">
            <Send className="h-8 w-8 text-slate-600 mb-2 opacity-50" />
            <span>No collection loaded yet.</span>
            <span className="text-[11px] text-slate-600 mt-1">Upload a Postman Collection JSON above.</span>
          </div>
        ) : (
          rootNodes.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
