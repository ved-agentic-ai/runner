'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Globe, 
  Lock, 
  Server
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

interface LogItem {
  id: string;
  timestamp: string;
  type: 'llm_generation' | 'target_api';
  method?: string;
  destination: string;
  payloadSummary: string;
  status: string;
  isSecretMasked: boolean;
  latencyMs?: number;
}

export const LiveTrafficSimulator: React.FC = () => {
  const { executionResults } = useRunnerStore();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isSimulating] = useState(true);

  // Sync execution results into live traffic logs
  useEffect(() => {
    const list = Object.values(executionResults);
    if (list.length > 0) {
      const realLogs: LogItem[] = list.map((res) => ({
        id: `real-${res.endpointId}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'target_api',
        method: res.method,
        destination: res.resolvedUrl || res.url,
        payloadSummary: res.requestBody ? 'Body Payload Transmitted' : 'Headers & Params Transmitted',
        status: res.status === 'passed' ? `${res.statusCode || 200} OK` : 'Failed / Pending',
        isSecretMasked: false,
        latencyMs: res.responseTimeMs,
      }));

      // Add a corresponding LLM test generation event showing local secret masking
      const firstRes = list[0];
      if (firstRes) {
        realLogs.unshift({
          id: `llm-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'llm_generation',
          destination: 'Google Gemini LLM API (Sanitized Rules Only)',
          payloadSummary: '{"url": "' + (firstRes.url || '') + '", "headers": {"Authorization": "{{REDACTED_SECRET}}"}}',
          status: '200 Test Script Generated',
          isSecretMasked: true,
          latencyMs: 140,
        });
      }
      setLogs(realLogs.slice(0, 8));
    }
  }, [executionResults]);

  // Auto-play ambient simulated traffic feed when idle
  useEffect(() => {
    if (Object.keys(executionResults).length === 0 && isSimulating) {
      const demoFeed: LogItem[] = [
        {
          id: 'd1',
          timestamp: '14:25:01',
          type: 'llm_generation',
          destination: 'AI Test Engine (Sanitized Metadata)',
          payloadSummary: 'GET {{baseUrl}}/users -> Masked headers {{REDACTED_SECRET}}',
          status: 'Generated 4 Test Rules',
          isSecretMasked: true,
          latencyMs: 180,
        },
        {
          id: 'd2',
          timestamp: '14:25:02',
          type: 'target_api',
          method: 'GET',
          destination: 'https://jsonplaceholder.typicode.com/users',
          payloadSummary: 'Resolved with Local Secrets: {{baseUrl}} = jsonplaceholder',
          status: '200 OK',
          isSecretMasked: false,
          latencyMs: 47,
        },
        {
          id: 'd3',
          timestamp: '14:25:03',
          type: 'target_api',
          method: 'POST',
          destination: 'https://jsonplaceholder.typicode.com/posts',
          payloadSummary: 'Resolved Payload: {"title": "Updated Title"}',
          status: '201 Created',
          isSecretMasked: false,
          latencyMs: 118,
        },
        {
          id: 'd4',
          timestamp: '14:25:04',
          type: 'llm_generation',
          destination: 'AI Test Engine (Sanitized Metadata)',
          payloadSummary: 'POST {{baseUrl}}/posts -> Masked body {"apiKey": "{{REDACTED_SECRET}}"}',
          status: 'Generated 5 Test Rules',
          isSecretMasked: true,
          latencyMs: 155,
        }
      ];
      setLogs(demoFeed);
    }
  }, [executionResults, isSimulating]);

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Live Request Traffic & Routing Simulator
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/80 px-2.5 py-0.5 text-purple-300 border border-purple-800/60 font-medium">
            <Cpu className="h-3 w-3 text-purple-400" /> Route A: Masked LLM Payload
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-emerald-300 border border-emerald-800/60 font-medium">
            <Globe className="h-3 w-3 text-emerald-400" /> Route B: Local Proxy &rarr; Target API
          </span>
        </div>
      </div>

      {/* Visual Telemetry Stream Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Route A Card: LLM Test Generation Path */}
        <div className="rounded-xl border border-purple-900/50 bg-purple-950/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
              <Cpu className="h-4 w-4 text-purple-400" />
              <span>Route A: AI Test Script Generation</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
              <Lock className="h-2.5 w-2.5" /> 100% Masked
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Transmits structural endpoints only to LLM. Secret tokens like passwords & API keys are masked locally.
          </p>
          <div className="rounded-lg border border-purple-900/60 bg-slate-950 p-2.5 text-[11px] font-mono text-purple-300 truncate">
            Payload: <span className="text-slate-400">{"{\"headers\": {\"Auth\": \"{{REDACTED_SECRET}}\"}}"}</span>
          </div>
        </div>

        {/* Route B Card: Target API Execution Path */}
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-300">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>Route B: Target API Runner Proxy</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/90 border border-indigo-700/60 px-2 py-0.5 text-[9px] font-bold text-indigo-300 uppercase">
              <Server className="h-2.5 w-2.5" /> Local Host Proxy
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Executes HTTP calls from localhost proxy. Secrets are substituted locally at runtime and sent directly to target server.
          </p>
          <div className="rounded-lg border border-emerald-900/60 bg-slate-950 p-2.5 text-[11px] font-mono text-emerald-300 truncate">
            Target Host: <span className="text-slate-200">https://jsonplaceholder.typicode.com</span>
          </div>
        </div>

      </div>

      {/* Live Stream Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Live Traffic Feed Stream</span>
          <span className="text-slate-500 font-mono text-[10px]">{logs.length} Recent Packets</span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs max-h-48 overflow-y-auto custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="p-2.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors font-mono">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                
                {log.type === 'llm_generation' ? (
                  <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-800/60 shrink-0">
                    AI LLM
                  </span>
                ) : (
                  <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-800/60 shrink-0">
                    {log.method || 'API'}
                  </span>
                )}

                <span className="text-slate-200 truncate min-w-0 font-medium">
                  {log.destination}
                </span>
              </div>

              <div className="flex items-center space-x-3 shrink-0 text-[11px]">
                {log.isSecretMasked && (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-[10px]">
                    <Lock className="h-3 w-3" /> Masked
                  </span>
                )}
                <span className="text-slate-400">{log.latencyMs}ms</span>
                <span className="text-emerald-400 font-semibold">{log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
