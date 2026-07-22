'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Target, 
  Globe, 
  Folder, 
  CheckCircle2,
  Wand2,
  HelpCircle,
  Play
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TestCaseRule, TreeNode } from '@/lib/types';
import { getQuotaState } from '@/lib/quota-tracker';
import { RuleGeneratorSimulationModal } from './RuleGeneratorSimulationModal';

export const CustomTestRuleGeneratorModal: React.FC = () => {
  const { 
    flatEndpointMap, 
    rootNodes, 
    generatedTestSuites, 
    geminiApiKey 
  } = useRunnerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [scope, setScope] = useState<'global' | 'folder' | 'endpoint'>('global');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quota = getQuotaState(geminiApiKey);

  const folderNodes: TreeNode[] = [];
  const endpointNodes: TreeNode[] = Array.from(flatEndpointMap.values());

  function collectFolders(nodes: TreeNode[]) {
    nodes.forEach(n => {
      if (n.type === 'folder') {
        folderNodes.push(n);
        if (n.children) collectFolders(n.children);
      }
    });
  }
  collectFolders(rootNodes);

  const handleGenerateCustomRules = async () => {
    if (!promptInput.trim()) return;
    setIsGenerating(true);
    setSuccessMsg(null);

    const newRules: TestCaseRule[] = [];
    const lower = promptInput.toLowerCase();

    // 1. Rate Limit 429 Check
    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests') || lower.includes('throttled')) {
      newRules.push({
        id: `custom-ratelimit-${Date.now()}`,
        type: 'status_code',
        description: 'Rate Limit Check: Validate response HTTP 429 Too Many Requests',
        expectedValue: 429
      });
    }

    // 2. Gateway Timeout 504 Check
    if (lower.includes('gateway timeout') || lower.includes('504') || lower.includes('server timeout')) {
      newRules.push({
        id: `custom-timeout-${Date.now()}`,
        type: 'status_code',
        description: 'Timeout Check: Validate response HTTP 504 Gateway Timeout',
        expectedValue: 504
      });
    }

    // 3. Unauthorized 401 / 403 Check
    if (lower.includes('unauthorized') || lower.includes('401') || lower.includes('forbidden') || lower.includes('403')) {
      const code = lower.includes('403') || lower.includes('forbidden') ? 403 : 401;
      newRules.push({
        id: `custom-auth-${Date.now()}`,
        type: 'status_code',
        description: `Auth Check: Validate HTTP ${code} ${code === 401 ? 'Unauthorized' : 'Forbidden'}`,
        expectedValue: code
      });
    }

    // 4. General Status Code matching (200, 201, 500, etc.)
    if (!lower.includes('rate limit') && !lower.includes('gateway timeout') && (lower.includes('status') || lower.includes('200') || lower.includes('201') || lower.includes('500'))) {
      const match = lower.match(/\b(200|201|204|400|401|404|429|500|502|503|504)\b/);
      const code = match ? Number(match[1]) : 200;
      newRules.push({
        id: `custom-status-${Date.now()}`,
        type: 'status_code',
        description: `Status Check: Validate response HTTP ${code}`,
        expectedValue: code
      });
    }

    // 5. Latency SLA rule
    if (lower.includes('latency') || lower.includes('sla') || lower.includes('ms') || lower.includes('speed') || lower.includes('under') || lower.includes('time')) {
      const match = lower.match(/\b(\d+)\s*ms\b/) || lower.match(/\b(\d+)\b/);
      const ms = match ? Number(match[1]) : 1000;
      newRules.push({
        id: `custom-sla-${Date.now()}`,
        type: 'latency_sla',
        description: `Custom SLA: Latency must be under ${ms}ms`,
        expectedValue: ms
      });
    }

    // 6. Header check rule
    if (lower.includes('header') || lower.includes('content-type') || lower.includes('x-') || lower.includes('authorization')) {
      const headerName = lower.includes('content-type') ? 'content-type' : 'authorization';
      newRules.push({
        id: `custom-header-${Date.now()}`,
        type: 'header_exists',
        description: `Custom Header: Check "${headerName}" is present`,
        expectedValue: headerName
      });
    }

    // 7. Body substring contains rule
    if (lower.includes('contains') || lower.includes('string') || lower.includes('body') || lower.includes('text')) {
      const match = promptInput.match(/["']([^"']+)["']/);
      const searchStr = match ? match[1] : 'OK';
      newRules.push({
        id: `custom-contains-${Date.now()}`,
        type: 'body_contains',
        description: `Custom Body Check: Must contain "${searchStr}"`,
        expectedValue: searchStr
      });
    }

    // Fallback rule if no specific keyword matched
    if (newRules.length === 0) {
      newRules.push({
        id: `custom-generic-${Date.now()}`,
        type: 'json_schema',
        description: `Custom Rule: "${promptInput.slice(0, 40)}..."`,
        jsonPath: '$'
      });
    }

    const updatedSuites = { ...generatedTestSuites };

    let targetEndpointIds: string[] = [];
    if (scope === 'global') {
      targetEndpointIds = Array.from(flatEndpointMap.keys());
    } else if (scope === 'endpoint') {
      if (selectedTargetId) targetEndpointIds = [selectedTargetId];
    } else if (scope === 'folder') {
      const folder = folderNodes.find(f => f.id === selectedTargetId);
      if (folder) {
        function getSubIds(n: TreeNode): string[] {
          let ids: string[] = [];
          if (n.type === 'endpoint') ids.push(n.id);
          if (n.children) n.children.forEach(c => { ids = ids.concat(getSubIds(c)); });
          return ids;
        }
        targetEndpointIds = getSubIds(folder);
      }
    }

    targetEndpointIds.forEach(id => {
      const existing = updatedSuites[id] || {
        endpointId: id,
        endpointName: flatEndpointMap.get(id)?.name || id,
        method: flatEndpointMap.get(id)?.method || 'GET',
        url: flatEndpointMap.get(id)?.url || '',
        generatedBy: 'gemini_ai',
        summary: 'Custom User Suite',
        testCases: []
      };

      updatedSuites[id] = {
        ...existing,
        testCases: [...existing.testCases, ...newRules]
      };
    });

    useRunnerStore.setState({ generatedTestSuites: updatedSuites });
    setIsGenerating(false);
    setSuccessMsg(`Successfully generated and applied ${newRules.length} custom test rule(s) to ${targetEndpointIds.length} endpoint(s)!`);

    setTimeout(() => {
      setSuccessMsg(null);
      setIsOpen(false);
    }, 1500);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Natural Language Custom Test Generator
              </h2>
              <p className="text-xs text-slate-400">
                Describe test rules in plain English (e.g. "Check rate limit 429 and latency under 500ms").
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets Buttons */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test Rule Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPromptInput('Check rate limit HTTP 429 and latency under 500ms')}
              className="rounded-lg bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-900 transition-colors"
            >
              ⚡ Rate Limit 429
            </button>
            <button
              onClick={() => setPromptInput('Check gateway timeout HTTP 504 and SLA under 2000ms')}
              className="rounded-lg bg-red-950/60 border border-red-800/60 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-900 transition-colors"
            >
              ⏱️ Gateway Timeout 504
            </button>
            <button
              onClick={() => setPromptInput('Check unauthorized HTTP 401 and Authorization header')}
              className="rounded-lg bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-900 transition-colors"
            >
              🔒 Auth 401 / 403
            </button>
          </div>
        </div>

        {/* Natural Language Prompt Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Natural Language Test Requirement
          </label>
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. Check rate limit 429, gateway timeout 504, or latency under 500ms..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-purple-500 focus:outline-none custom-scrollbar"
          />
        </div>

        {/* Target Scope Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Target Application Scope
          </label>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setScope('global')}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border font-semibold transition-all ${
                scope === 'global'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Globe className="h-4 w-4 text-indigo-400" />
              <span>Global (All)</span>
            </button>

            <button
              onClick={() => setScope('folder')}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border font-semibold transition-all ${
                scope === 'folder'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Folder className="h-4 w-4 text-amber-400" />
              <span>Specific Folder</span>
            </button>

            <button
              onClick={() => setScope('endpoint')}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border font-semibold transition-all ${
                scope === 'endpoint'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-sm'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Target className="h-4 w-4 text-emerald-400" />
              <span>Endpoint Only</span>
            </button>
          </div>

          {scope === 'folder' && (
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select target folder...</option>
              {folderNodes.map(f => (
                <option key={f.id} value={f.id}>Folder: {f.name}</option>
              ))}
            </select>
          )}

          {scope === 'endpoint' && (
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="">Select target endpoint...</option>
              {endpointNodes.map(ep => (
                <option key={ep.id} value={ep.id}>[{ep.method}] {ep.name}</option>
              ))}
            </select>
          )}
        </div>

        {successMsg && (
          <div className="rounded-xl bg-emerald-950/80 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <RuleGeneratorSimulationModal />

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateCustomRules}
              disabled={isGenerating || !promptInput.trim()}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all"
            >
              <Wand2 className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Rules...' : 'Generate & Apply Rules'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-700/60 px-3.5 py-1.5 text-xs font-semibold text-purple-200 hover:from-purple-900 hover:to-indigo-900 transition-all shadow-md whitespace-nowrap"
      >
        <Wand2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        <span>+ Custom AI Test Generator</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
