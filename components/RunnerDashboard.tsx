'use client';

import React, { useState, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Sparkles, 
  Eye, 
  FolderDown,
  ListFilter,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TreeNode } from '@/lib/types';
import { EndpointDetailSheet } from './EndpointDetailSheet';

interface RunnerDashboardProps {
  onSaveToServer?: () => void;
}

type SortField = 'method' | 'name' | 'status' | 'latency' | 'assertions';

export const RunnerDashboard: React.FC<RunnerDashboardProps> = ({ onSaveToServer }) => {
  const { 
    runSummary, 
    executionResults, 
    runSelectedEndpoints, 
    clearResults,
    selectedNodeIds,
    rootNodes,
    serverRootNodes,
    activeWorkspaceSource,
    flatEndpointMap,
    searchQuery,
    filterStatus,
    setFilterStatus,
    setSelectedEndpointIdForDetail
  } = useRunnerStore();

  const activeNodes = (activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0) 
    ? serverRootNodes 
    : rootNodes;

  const selectedEndpointCount = useMemo(() => {
    const selectedSet = new Set(selectedNodeIds);
    const q = searchQuery.trim().toLowerCase();
    let count = 0;

    function countSelectedEndpoints(nodes: TreeNode[], parentFolderMatched = false) {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          const folderMatches = node.name.toLowerCase().includes(q);
          if (node.children) {
            countSelectedEndpoints(node.children, parentFolderMatched || folderMatches);
          }
        } else {
          if (selectedSet.has(node.id)) {
            if (!q) {
              count++;
            } else {
              const nameMatch = node.name.toLowerCase().includes(q);
              const methodMatch = node.method?.toLowerCase().includes(q);
              const urlMatch = node.url?.toLowerCase().includes(q);
              if (nameMatch || methodMatch || urlMatch || parentFolderMatched) {
                count++;
              }
            }
          }
        }
      });
    }

    if (activeNodes && activeNodes.length > 0) {
      countSelectedEndpoints(activeNodes, false);
    } else if (flatEndpointMap && flatEndpointMap.size > 0) {
      flatEndpointMap.forEach((node, id) => {
        if (selectedSet.has(id) && (node.type === 'endpoint' || !node.children)) {
          if (!q || node.name.toLowerCase().includes(q) || node.url?.toLowerCase().includes(q)) {
            count++;
          }
        }
      });
    }

    return count;
  }, [selectedNodeIds, activeNodes, flatEndpointMap, searchQuery]);

  const [resultsPanelCollapsed, setResultsPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'flat' | 'status' | 'reason'>('flat');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Sorting State
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const resultsList = Object.values(executionResults);
  const filteredResults = resultsList.filter((res) => {
    if (filterStatus === 'passed') return res.status === 'passed';
    if (filterStatus === 'failed') return res.status === 'failed';
    if (filterStatus === 'running') return res.status === 'running' || res.status === 'pending';
    return true;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortField) return 0;
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'method') {
      valA = a.method || '';
      valB = b.method || '';
    } else if (sortField === 'name') {
      valA = a.name || '';
      valB = b.name || '';
    } else if (sortField === 'status') {
      valA = a.statusCode || (a.status === 'passed' ? 200 : 500);
      valB = b.statusCode || (b.status === 'passed' ? 200 : 500);
    } else if (sortField === 'latency') {
      valA = a.responseTimeMs || 0;
      valB = b.responseTimeMs || 0;
    } else if (sortField === 'assertions') {
      valA = a.assertionResults.filter((x: any) => x.status === 'pass').length;
      valB = b.assertionResults.filter((x: any) => x.status === 'pass').length;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const passPercentage = runSummary.total > 0 
    ? Math.round((runSummary.passed / runSummary.total) * 100) 
    : 0;

  const isWorkspaceEmpty = useRunnerStore((s) => s.rootNodes.length === 0 && s.serverRootNodes.length === 0);

  // Grouped Results logic
  const passedGroup = sortedResults.filter((r) => r.status === 'passed');
  const failedGroup = sortedResults.filter((r) => r.status === 'failed');
  const pendingGroup = sortedResults.filter((r) => r.status === 'pending' || r.status === 'running');

  // Group by Failure Reason / Root Cause buckets
  const failureReasonBuckets = useMemo(() => {
    const map = new Map<string, any[]>();
    sortedResults.forEach((res) => {
      let key = 'PASSED (200 OK)';
      if (res.status !== 'passed') {
        if (res.responseBody) {
          try {
            const parsed = typeof res.responseBody === 'string' ? JSON.parse(res.responseBody) : res.responseBody;
            if (parsed.errorResponse?.statusMessage) {
              key = `HTTP ${res.statusCode || 400}: ${parsed.errorResponse.statusMessage}`;
            } else if (parsed.errorResponse?.rootCause) {
              key = `HTTP ${res.statusCode || 400}: ${parsed.errorResponse.rootCause}`;
            } else if (parsed.message) {
              key = `HTTP ${res.statusCode || 400}: ${parsed.message}`;
            }
          } catch (e) {}
        }
        if (key === 'PASSED (200 OK)' && res.assertionResults && res.assertionResults.length > 0) {
          const failed = res.assertionResults.find((a: any) => a.status === 'fail');
          if (failed) key = `Assertion Fail: ${failed.description || failed.message}`;
        }
        if (key === 'PASSED (200 OK)') {
          key = `HTTP ${res.statusCode || 'ERR'}: Request Execution Failure`;
        }
      }

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(res);
    });
    return Array.from(map.entries());
  }, [sortedResults]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-600 ml-1 inline shrink-0" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-indigo-400 ml-1 inline shrink-0" />
      : <ArrowDown className="h-3 w-3 text-indigo-400 ml-1 inline shrink-0" />;
  };

  const renderRow = (res: any) => {
    const passedAssertions = res.assertionResults.filter((a: any) => a.status === 'pass').length;
    const totalAssertions = res.assertionResults.length;

    return (
      <tr 
        key={res.endpointId} 
        onClick={() => setSelectedEndpointIdForDetail(res.endpointId)}
        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
      >
        <td className="py-2.5 px-3">
          <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
            res.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
            res.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
            res.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
            'bg-amber-950 text-amber-400 border border-amber-800'
          }`}>
            {res.method}
          </span>
        </td>

        <td className="py-2.5 px-3 max-w-xs truncate">
          <div className="font-sans font-semibold text-slate-200 truncate group-hover:text-indigo-300">
            {res.name}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {res.resolvedUrl}
          </div>
        </td>

        <td className="py-2.5 px-3">
          {res.status === 'running' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950 px-2 py-0.5 text-[10px] text-indigo-400 font-bold border border-indigo-800 animate-pulse">
              Running...
            </span>
          )}
          {res.status === 'passed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[10px] text-emerald-400 font-bold border border-emerald-800">
              <CheckCircle2 className="h-3 w-3" /> {res.statusCode || 200} OK
            </span>
          )}
          {res.status === 'failed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-950 px-2.5 py-0.5 text-[10px] text-red-400 font-bold border border-red-800">
              <XCircle className="h-3 w-3" /> {res.statusCode || 'ERR'}
            </span>
          )}
        </td>

        <td className="py-2.5 px-3">
          {res.responseTimeMs > 0 ? (
            <span className="text-slate-300">{res.responseTimeMs} ms</span>
          ) : (
            <span className="text-slate-600">-</span>
          )}
        </td>

        <td className="py-2.5 px-3 font-sans">
          {totalAssertions > 0 ? (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              passedAssertions === totalAssertions ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <Sparkles className="h-3 w-3 text-purple-400" />
              {passedAssertions}/{totalAssertions} Passed
            </span>
          ) : (
            <span className="text-slate-600 text-[11px]">-</span>
          )}
        </td>

        <td className="py-2.5 px-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEndpointIdForDetail(res.endpointId);
            }}
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
            title="Inspect Response & Assertions"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-5 flex flex-col h-full">
      {/* Execution Telemetry & Live Controls Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-indigo-400" /> Execution Telemetry & Live Controls
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Run selected API endpoints, inspect live SLA telemetry, and refresh execution results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSaveToServer}
            disabled={isWorkspaceEmpty}
            title={isWorkspaceEmpty ? 'Workspace is empty. Load or upload a Postman collection first.' : 'Save collection to server'}
            className={`inline-flex items-center space-x-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-md ${
              isWorkspaceEmpty 
                ? 'border-slate-800 bg-slate-900/60 text-slate-500 cursor-not-allowed opacity-50' 
                : 'border-amber-500/40 bg-amber-950/60 text-amber-300 hover:bg-amber-900'
            }`}
          >
            <FolderDown className={`h-4 w-4 ${isWorkspaceEmpty ? 'text-slate-500' : 'text-amber-400'}`} />
            <span>💾 Save to Server</span>
          </button>

          <button
            onClick={clearResults}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
            title="Reset telemetry counters"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Refresh Results</span>
          </button>

          <button
            onClick={runSelectedEndpoints}
            disabled={runSummary.status === 'running' || selectedNodeIds.length === 0}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-pink-500 transition-all disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>{runSummary.status === 'running' ? 'Running Suite...' : 'Run Selected Endpoints'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pass Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Pass Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white font-mono">{passPercentage}%</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {runSummary.passed} / {runSummary.total} Passed
            </span>
          </div>
        </div>

        {/* Failed Tests */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Failed Tests</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white font-mono">{runSummary.failed}</span>
            <span className="text-[11px] text-slate-400">
              {runSummary.failed > 0 ? 'Action Required' : 'Clean Run'}
            </span>
          </div>
        </div>

        {/* Avg Latency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Avg Response Time</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white font-mono">{runSummary.avgLatencyMs}ms</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Min: {runSummary.minLatencyMs}ms
            </span>
          </div>
        </div>

        {/* Total Endpoints */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Endpoints</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white font-mono">{selectedEndpointCount}</span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Selected for Run
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {runSummary.status === 'running' && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
            <span>Running Test Suite Execution...</span>
            <span>{runSummary.total - runSummary.pending} / {runSummary.total} Executed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300"
              style={{ width: `${Math.round(((runSummary.total - runSummary.pending) / (runSummary.total || 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Execution Results Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md flex-1 flex flex-col min-h-0">
        
        {/* Controls Bar with Symmetrical Tab Alignment */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter Status Tabs */}
            <div className="inline-flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
              {[
                { id: 'all', label: 'All Results' },
                { id: 'passed', label: `Passed (${runSummary.passed})` },
                { id: 'failed', label: `Failed (${runSummary.failed})` },
                { id: 'running', label: `Pending/Running (${runSummary.pending + runSummary.running})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="hidden sm:block h-6 w-px bg-slate-800" />

            {/* View Mode Grouping Toggles */}
            <div className="inline-flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
              <button
                onClick={() => setViewMode('flat')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flat' ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flat List
              </button>

              <button
                onClick={() => setViewMode('status')}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'status' ? 'bg-purple-950 text-purple-200 border border-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5 text-purple-400" />
                <span>By Status</span>
              </button>

              <button
                onClick={() => setViewMode('reason')}
                className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'reason' ? 'bg-red-950 text-red-200 border border-red-700 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Group failed requests by their specific root cause / error reason"
              >
                <Flame className="h-3.5 w-3.5 text-red-400" />
                <span>By Failure Reason</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end xl:self-center">
            <span className="text-xs text-slate-400 font-mono">
              Showing {sortedResults.length} endpoint executions
            </span>

            {/* Collapse Results Panel Button */}
            <button
              onClick={() => setResultsPanelCollapsed(!resultsPanelCollapsed)}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 transition-all cursor-pointer"
              title={resultsPanelCollapsed ? 'Expand Results' : 'Collapse Results'}
            >
              {resultsPanelCollapsed ? <Maximize2 className="h-4 w-4 text-indigo-400" /> : <Minimize2 className="h-4 w-4 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Execution Results Data Table */}
        {!resultsPanelCollapsed && (
          <div className="mt-3 max-h-[500px] overflow-x-auto overflow-y-auto custom-scrollbar border border-slate-800/60 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/90 sticky top-0 z-10 select-none">
                <tr>
                  <th 
                    onClick={() => handleSort('method')} 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Method {renderSortIndicator('method')}
                  </th>
                  <th 
                    onClick={() => handleSort('name')} 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Endpoint Name & URL {renderSortIndicator('name')}
                  </th>
                  <th 
                    onClick={() => handleSort('status')} 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th 
                    onClick={() => handleSort('latency')} 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Latency {renderSortIndicator('latency')}
                  </th>
                  <th 
                    onClick={() => handleSort('assertions')} 
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    AI Assertions {renderSortIndicator('assertions')}
                  </th>
                  <th className="py-2.5 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      No endpoint runs to display yet. Click &quot;Run Selected Endpoints&quot; above to execute.
                    </td>
                  </tr>
                ) : viewMode === 'reason' ? (
                  /* GROUP BY FAILURE REASON / ROOT CAUSE BUCKETS */
                  failureReasonBuckets.map(([reasonKey, items], bIdx) => {
                    const isCollapsed = collapsedGroups[`reason-${bIdx}`] ?? false;
                    const isPassedBucket = reasonKey.includes('PASSED');

                    return (
                      <React.Fragment key={bIdx}>
                        <tr 
                          onClick={() => toggleGroupCollapse(`reason-${bIdx}`)}
                          className={`border-y font-sans font-bold cursor-pointer transition-colors select-none ${
                            isPassedBucket 
                              ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-red-950/60 border-red-800/90 text-red-200 hover:bg-red-900/70'
                          }`}
                        >
                          <td colSpan={6} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs">
                                <span>{isCollapsed ? '▶' : '▼'}</span>
                                {isPassedBucket ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                )}
                                <span className="font-extrabold uppercase">{reasonKey} ({items.length} Endpoints)</span>
                              </div>
                              <span className="text-[10px] font-mono font-normal opacity-80">
                                {isCollapsed ? 'Click to Expand Reason' : 'Click to Collapse'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!isCollapsed && items.map(renderRow)}
                      </React.Fragment>
                    );
                  })
                ) : viewMode === 'status' ? (
                  <>
                    {/* GROUP 1: PASSED (COLLAPSIBLE) */}
                    {passedGroup.length > 0 && (
                      <>
                        <tr 
                          onClick={() => toggleGroupCollapse('passed')}
                          className="bg-emerald-950/50 border-y border-emerald-800/80 font-sans font-bold text-emerald-300 cursor-pointer hover:bg-emerald-900/60 select-none transition-colors"
                        >
                          <td colSpan={6} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-emerald-400 font-bold">{collapsedGroups['passed'] ? '▶' : '▼'}</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span>✅ PASSED ENDPOINTS ({passedGroup.length})</span>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                {collapsedGroups['passed'] ? 'Click to Expand Group' : 'Click to Collapse Group'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups['passed'] && passedGroup.map(renderRow)}
                      </>
                    )}

                    {/* GROUP 2: FAILED (COLLAPSIBLE) */}
                    {failedGroup.length > 0 && (
                      <>
                        <tr 
                          onClick={() => toggleGroupCollapse('failed')}
                          className="bg-red-950/50 border-y border-red-800/80 font-sans font-bold text-red-300 cursor-pointer hover:bg-red-900/60 select-none transition-colors"
                        >
                          <td colSpan={6} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-red-400 font-bold">{collapsedGroups['failed'] ? '▶' : '▼'}</span>
                                <XCircle className="h-4 w-4 text-red-400" />
                                <span>❌ FAILED ENDPOINTS ({failedGroup.length})</span>
                              </div>
                              <span className="text-[10px] text-red-400 font-mono font-normal">
                                {collapsedGroups['failed'] ? 'Click to Expand Group' : 'Click to Collapse Group'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups['failed'] && failedGroup.map(renderRow)}
                      </>
                    )}

                    {/* GROUP 3: PENDING/RUNNING (COLLAPSIBLE) */}
                    {pendingGroup.length > 0 && (
                      <>
                        <tr 
                          onClick={() => toggleGroupCollapse('pending')}
                          className="bg-slate-900 border-y border-slate-800 font-sans font-bold text-indigo-300 cursor-pointer hover:bg-slate-800 select-none transition-colors"
                        >
                          <td colSpan={6} className="py-2.5 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-indigo-400 font-bold">{collapsedGroups['pending'] ? '▶' : '▼'}</span>
                                <Clock className="h-4 w-4 text-indigo-400" />
                                <span>⏳ PENDING / RUNNING ({pendingGroup.length})</span>
                              </div>
                              <span className="text-[10px] text-indigo-400 font-mono font-normal">
                                {collapsedGroups['pending'] ? 'Click to Expand Group' : 'Click to Collapse Group'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!collapsedGroups['pending'] && pendingGroup.map(renderRow)}
                      </>
                    )}
                  </>
                ) : (
                  sortedResults.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POSTMAN-STYLE INTERACTIVE ENDPOINT INSPECTOR DRAWER / MODAL */}
      <EndpointDetailSheet />
    </div>
  );
};

function ActivityIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
