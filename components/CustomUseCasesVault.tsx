'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  Folder, 
  FileCode, 
  CheckCircle2,
  AlertTriangle,
  Filter,
  Wand2,
  ChevronDown,
  ChevronRight,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TestCaseRule, EndpointTestSuite } from '@/lib/types';
import { generateSmartHeuristicTests } from '@/lib/ai-test-generator';

export const CustomUseCasesVault: React.FC = () => {
  const { 
    generatedTestSuites, 
    flatEndpointMap, 
    serverFlatEndpointMap, 
    activeWorkspaceSource, 
    rootNodes, 
    serverRootNodes, 
    collectionName 
  } = useRunnerStore();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'custom' | 'user_customized'>('all');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Collapse state per endpoint
  const [collapsedEndpoints, setCollapsedEndpoints] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  
  // Rule Edit Form State
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<string>('status_code');
  const [editExpected, setEditExpected] = useState<string>('200');

  // New Rule Form State per Endpoint
  const [addingForEndpointId, setAddingForEndpointId] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<string>('status_code');
  const [newExpected, setNewExpected] = useState<string>('200');

  // Gather ALL endpoints from active workspace flatMap
  const activeFlatMap = useMemo(() => {
    if ((activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0)) {
      return serverFlatEndpointMap;
    }
    return flatEndpointMap;
  }, [activeWorkspaceSource, rootNodes, serverRootNodes, flatEndpointMap, serverFlatEndpointMap]);

  // Combine store generatedTestSuites with fallback heuristic suites for endpoints not yet generated
  const allSuites = useMemo(() => {
    const suitesMap: Record<string, EndpointTestSuite> = { ...generatedTestSuites };

    if (activeFlatMap && typeof activeFlatMap.forEach === 'function') {
      activeFlatMap.forEach((node, id) => {
        if (!suitesMap[id]) {
          suitesMap[id] = generateSmartHeuristicTests(node, node.url || '');
        }
      });
    }

    return Object.values(suitesMap);
  }, [generatedTestSuites, activeFlatMap]);

  // Count total rules across all endpoints
  const totalRulesCount = useMemo(() => {
    return allSuites.reduce((acc, s) => acc + (s.testCases?.length || 0), 0);
  }, [allSuites]);

  // Filtered Suites
  const filteredSuites = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allSuites.map((s) => {
      let cases = s.testCases || [];

      if (filterCategory === 'custom') {
        cases = cases.filter(tc => tc.id.startsWith('custom-'));
      } else if (filterCategory === 'user_customized') {
        if (!s.userCustomized) return { ...s, testCases: [] };
      }

      if (query) {
        cases = cases.filter(tc => 
          tc.description.toLowerCase().includes(query) || 
          s.endpointName.toLowerCase().includes(query) || 
          s.url.toLowerCase().includes(query)
        );
      }

      return {
        ...s,
        testCases: cases
      };
    }).filter(s => s.testCases.length > 0 || (query && (s.endpointName.toLowerCase().includes(query) || s.url.toLowerCase().includes(query))));
  }, [allSuites, search, filterCategory]);

  const toggleEndpointCollapse = (endpointId: string) => {
    setCollapsedEndpoints(prev => ({
      ...prev,
      [endpointId]: !prev[endpointId]
    }));
  };

  const toggleExpandCollapseAll = () => {
    const nextState = !allCollapsed;
    setAllCollapsed(nextState);
    const newCollapsedMap: Record<string, boolean> = {};
    allSuites.forEach(s => {
      newCollapsedMap[s.endpointId] = nextState;
    });
    setCollapsedEndpoints(newCollapsedMap);
  };

  const startEditRule = (rule: TestCaseRule) => {
    setEditingRuleId(rule.id);
    setEditDesc(rule.description);
    setEditType(rule.type);
    setEditExpected(String(rule.expectedValue ?? '200'));
  };

  const saveEditRule = (endpointId: string, ruleId: string) => {
    const updatedSuites = { ...useRunnerStore.getState().generatedTestSuites };
    const suite = updatedSuites[endpointId] || allSuites.find(s => s.endpointId === endpointId);
    if (suite) {
      const updatedCases = suite.testCases.map(tc => {
        if (tc.id === ruleId) {
          return {
            ...tc,
            description: editDesc,
            type: editType as any,
            expectedValue: editType === 'status_code' || editType === 'latency_sla' ? Number(editExpected) : editExpected
          };
        }
        return tc;
      });

      updatedSuites[endpointId] = {
        ...suite,
        userCustomized: true,
        testCases: updatedCases
      };

      useRunnerStore.setState({ generatedTestSuites: updatedSuites });
    }
    setEditingRuleId(null);
  };

  const deleteRule = (endpointId: string, ruleId: string) => {
    const updatedSuites = { ...useRunnerStore.getState().generatedTestSuites };
    const suite = updatedSuites[endpointId] || allSuites.find(s => s.endpointId === endpointId);
    if (suite) {
      updatedSuites[endpointId] = {
        ...suite,
        userCustomized: true,
        testCases: suite.testCases.filter(tc => tc.id !== ruleId)
      };
      useRunnerStore.setState({ generatedTestSuites: updatedSuites });
    }
  };

  const handleAddNewRule = (endpointId: string) => {
    if (!newDesc.trim()) return;
    const updatedSuites = { ...useRunnerStore.getState().generatedTestSuites };
    const suite = updatedSuites[endpointId] || allSuites.find(s => s.endpointId === endpointId);
    if (suite) {
      const newRule: TestCaseRule = {
        id: `custom-manual-${Date.now()}`,
        type: newType as any,
        description: newDesc,
        expectedValue: newType === 'status_code' || newType === 'latency_sla' ? Number(newExpected) : newExpected
      };

      updatedSuites[endpointId] = {
        ...suite,
        userCustomized: true,
        testCases: [...suite.testCases, newRule]
      };

      useRunnerStore.setState({ generatedTestSuites: updatedSuites });
    }
    setAddingForEndpointId(null);
    setNewDesc('');
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl flex flex-col space-y-5">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Custom & AI Generated Test Use Cases Vault ({totalRulesCount} Total Rules across {allSuites.length} Endpoints)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full management vault for viewing, editing, adding, or deleting test rules for any endpoint in <strong className="text-slate-200">{collectionName || 'Default Suite'}</strong>.
          </p>
        </div>

        {/* Controls: Collapse All + Filter + Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Expand / Collapse All */}
          <button
            onClick={toggleExpandCollapseAll}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            title={allCollapsed ? "Expand all endpoint test rules" : "Collapse all endpoint test rules"}
          >
            {allCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{allCollapsed ? 'Expand All' : 'Collapse All'}</span>
          </button>

          {/* Filter Categories */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterCategory === 'all' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All Rules
            </button>
            <button
              onClick={() => setFilterCategory('user_customized')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterCategory === 'user_customized' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
            >
              User Customized
            </button>
            <button
              onClick={() => setFilterCategory('custom')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${filterCategory === 'custom' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Custom Manual
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[180px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search rules or endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Suites Grid */}
      <div className="space-y-4">
        {filteredSuites.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No test suites match your search or category filter.
          </div>
        ) : (
          filteredSuites.map((suite) => {
            const isCollapsed = collapsedEndpoints[suite.endpointId] ?? allCollapsed;

            return (
              <div key={suite.endpointId} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                
                {/* Collapsible Endpoint Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <button
                    onClick={() => toggleEndpointCollapse(suite.endpointId)}
                    className="flex items-center space-x-2 text-left hover:text-white transition-colors min-w-0"
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                      suite.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      suite.method === 'POST' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                      suite.method === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {suite.method}
                    </span>
                    <span className="font-bold text-xs text-slate-200 truncate max-w-xs sm:max-w-md">{suite.endpointName}</span>
                    <span className="text-[11px] text-slate-500 font-mono hidden md:inline truncate font-normal">({suite.url})</span>
                    {suite.userCustomized && (
                      <span className="rounded bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 text-[9px] font-bold shrink-0">
                        ✍ User Customized
                      </span>
                    )}
                  </button>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {suite.testCases.length} {suite.testCases.length === 1 ? 'Rule' : 'Rules'}
                    </span>
                    <button
                      onClick={() => {
                        setAddingForEndpointId(addingForEndpointId === suite.endpointId ? null : suite.endpointId);
                        if (isCollapsed) toggleEndpointCollapse(suite.endpointId);
                      }}
                      className="inline-flex items-center space-x-1 rounded-lg bg-purple-950/60 border border-purple-800 px-2 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-900 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Rule</span>
                    </button>
                  </div>
                </div>

                {/* Add New Rule Inline Form */}
                {addingForEndpointId === suite.endpointId && (
                  <div className="rounded-lg border border-purple-800/60 bg-purple-950/20 p-3 space-y-2 text-xs">
                    <span className="font-bold text-purple-300">Add New Test Assertion Rule</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Rule description..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-500"
                      />
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-200"
                      >
                        <option value="status_code">Status Code</option>
                        <option value="latency_sla">Latency SLA (ms)</option>
                        <option value="header_exists">Header Exists</option>
                        <option value="body_contains">Body Substring</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Expected value (e.g. 200, 429, 504)..."
                        value={newExpected}
                        onChange={(e) => setNewExpected(e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setAddingForEndpointId(null)}
                        className="rounded-lg border border-slate-800 px-3 py-1 text-[11px] text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddNewRule(suite.endpointId)}
                        className="rounded-lg bg-purple-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-purple-500"
                      >
                        Save New Rule
                      </button>
                    </div>
                  </div>
                )}

                {/* Rules List (Collapsible) */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suite.testCases.map((tc, idx) => {
                      const isEditing = editingRuleId === tc.id;
                      const isCustomRule = tc.id.startsWith('custom-');

                      if (isEditing) {
                        return (
                          <div key={tc.id} className="rounded-lg border border-indigo-800 bg-indigo-950/40 p-3 space-y-2 text-xs">
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full rounded border border-slate-800 bg-slate-900 p-1.5 text-xs text-slate-200"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value)}
                                className="rounded border border-slate-800 bg-slate-900 p-1.5 text-[11px] text-slate-200"
                              >
                                <option value="status_code">Status Code</option>
                                <option value="latency_sla">Latency SLA</option>
                                <option value="header_exists">Header Exists</option>
                                <option value="body_contains">Body Contains</option>
                              </select>
                              <input
                                type="text"
                                value={editExpected}
                                onChange={(e) => setEditExpected(e.target.value)}
                                className="rounded border border-slate-800 bg-slate-900 p-1.5 text-[11px] text-slate-200"
                              />
                            </div>
                            <div className="flex justify-end space-x-1.5 pt-1">
                              <button
                                onClick={() => setEditingRuleId(null)}
                                className="rounded px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEditRule(suite.endpointId, tc.id)}
                                className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-500"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={tc.id || idx} className={`group relative rounded-lg border p-2.5 text-xs space-y-1 transition-colors ${
                          isCustomRule 
                            ? 'border-purple-800/80 bg-purple-950/20 hover:border-purple-600' 
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                        }`}>
                          <div className="flex items-center justify-between font-medium text-slate-200 pr-12">
                            <span className="truncate flex items-center gap-1.5">
                              #{idx + 1} {tc.description}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            {tc.expectedValue !== undefined && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Expected: <code className="text-purple-400">{String(tc.expectedValue)}</code>
                              </span>
                            )}

                            {isCustomRule && (
                              <span className="rounded bg-purple-950 text-purple-300 border border-purple-700 px-1.5 py-0.2 text-[9px] font-bold">
                                🪄 Custom Rule
                              </span>
                            )}
                          </div>

                          {/* Rule Action Buttons */}
                          <div className="absolute right-2 top-2 flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditRule(tc)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-indigo-300"
                              title="Edit this rule"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteRule(suite.endpointId, tc.id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                              title="Delete this rule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
