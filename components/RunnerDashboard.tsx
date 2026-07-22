'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  Layers, 
  BarChart3, 
  Eye,
  RotateCcw,
  Sparkles,
  Play
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const RunnerDashboard: React.FC = () => {
  const { 
    runSummary, 
    executionResults, 
    flatEndpointMap,
    filterStatus,
    setFilterStatus,
    setSelectedEndpointIdForDetail,
    runSelectedEndpoints,
    clearResults,
    collectionName
  } = useRunnerStore();

  const resultsList = Object.values(executionResults);
  const totalCount = runSummary.total || flatEndpointMap.size;
  const isRunning = runSummary.status === 'running';

  const progressPercent = totalCount > 0 
    ? Math.round(((runSummary.passed + runSummary.failed) / totalCount) * 100) 
    : 0;

  const passRatePercent = (runSummary.passed + runSummary.failed) > 0
    ? Math.round((runSummary.passed / (runSummary.passed + runSummary.failed)) * 100)
    : 0;

  // Filter list by selected filter tab
  const filteredResults = resultsList.filter((res) => {
    if (filterStatus === 'passed') return res.status === 'passed';
    if (filterStatus === 'failed') return res.status === 'failed';
    if (filterStatus === 'running') return res.status === 'running' || res.status === 'pending';
    return true;
  });

  // Recharts latency data
  const latencyChartData = resultsList.map((r) => ({
    name: r.name.length > 15 ? r.name.slice(0, 15) + '...' : r.name,
    latency: r.responseTimeMs,
    status: r.status,
  }));

  return (
    <div className="flex flex-col space-y-5 h-full">
      
      {/* Top Telemetry Header Control Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Execution Telemetry & Live Controls
            </h2>
            <p className="text-xs text-slate-400">
              Run selected API endpoints, inspect live SLA telemetry, and refresh execution results.
            </p>
          </div>
        </div>

        {/* Action Controls: Refresh & Run Selected */}
        <div className="flex items-center space-x-2 shrink-0">
          {runSummary.total > 0 && (
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 shadow-sm"
              title="Reset Run Results"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Refresh Results</span>
            </button>
          )}

          <button
            onClick={() => runSelectedEndpoints()}
            disabled={isRunning || totalCount === 0}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-pink-500 active:scale-[0.98] disabled:opacity-50 transition-all whitespace-nowrap"
          >
            <Play className={`h-4 w-4 fill-current shrink-0 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running API Execution...' : 'Run Selected Endpoints'}</span>
          </button>
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Pass Rate KPI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pass Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{passRatePercent}%</span>
            <span className="text-xs text-emerald-400 font-semibold">{runSummary.passed} / {runSummary.passed + runSummary.failed} Passed</span>
          </div>
        </div>

        {/* Failed Count KPI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Failed Tests</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{runSummary.failed}</span>
            <span className="text-xs text-red-400 font-semibold">{runSummary.failed > 0 ? 'Action Required' : 'Clean Run'}</span>
          </div>
        </div>

        {/* Average Latency KPI */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Response Time</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{runSummary.avgLatencyMs}<span className="text-xs text-slate-400 font-normal">ms</span></span>
            <span className="text-xs text-slate-400">Min: {runSummary.minLatencyMs}ms</span>
          </div>
        </div>

        {/* Total Runner Executions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Endpoints</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">{totalCount}</span>
            <span className="text-xs text-purple-300 font-medium">Selected for Run</span>
          </div>
        </div>

      </div>

      {/* Progress Bar Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">Live Execution Progress</span>
            <span className="text-slate-400">({progressPercent}% completed)</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium">
            <span className="text-emerald-400">{runSummary.passed} Passed</span>
            <span className="text-slate-600">•</span>
            <span className="text-red-400">{runSummary.failed} Failed</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">{runSummary.pending} Pending</span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div 
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* Telemetry Chart Section */}
      {latencyChartData.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              Response Time & SLA Telemetry (ms)
            </h3>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                  {latencyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'passed' ? '#10b981' : entry.status === 'failed' ? '#ef4444' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Tabs & Data Table */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg min-h-[360px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'passed', label: `Passed (${runSummary.passed})` },
              { id: 'failed', label: `Failed (${runSummary.failed})` },
              { id: 'running', label: `Pending/Running (${runSummary.pending + runSummary.running})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  filterStatus === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredResults.length} endpoint executions
          </span>
        </div>

        {/* Execution Results Data Table */}
        <div className="mt-3 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint Name & URL</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">AI Assertions</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No endpoint runs to display yet. Click "Run Selected Endpoints" above to execute.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => {
                  const passedAssertions = res.assertionResults.filter(a => a.status === 'pass').length;
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
                            <CheckCircle2 className="h-3 w-3" /> {res.statusCode} OK
                          </span>
                        )}
                        {res.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-950 px-2.5 py-0.5 text-[10px] text-red-400 font-bold border border-red-800">
                            <XCircle className="h-3 w-3" /> {res.statusCode || 'ERR'}
                          </span>
                        )}
                        {res.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] text-slate-500 font-semibold border border-slate-800">
                            Pending
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
