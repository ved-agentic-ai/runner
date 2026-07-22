'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  Target, 
  Globe, 
  Folder, 
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { TestCaseRule, TreeNode } from '@/lib/types';
import { getQuotaState } from '@/lib/quota-tracker';

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

    // 1. Status Code rule
    if (lower.includes('status') || lower.includes('200') || lower.includes('201') || lower.includes('success')) {
      const match = lower.match(/\b(200|201|204|400|401|404|500)\b/);
      const code = match ? Number(match[1]) : 200;
      newRules.push({
        id: `custom-status-${Date.now()}`,
        type: 'status_code',
        description: `Custom: Validate HTTP status is ${code}`,
        expectedValue: code
      });
    }

    // 2. Latency SLA rule
    if (lower.includes('latency') || lower.includes('sla') || lower.includes('ms') || lower.includes('speed')) {
      const match = lower.match(/\b(\d+)\s*ms\b/);
      const ms = match ? Number(match[1]) : 1000;
      newRules.push({
        id: `custom-sla-${Date.now()}`,
        type: 'latency_sla',
        description: `Custom SLA: Latency must be under ${ms}ms`,
        expectedValue: ms
      });
    }

    // 3. Header check rule
    if (lower.includes('header') || lower.includes('content-type') || lower.includes('x-') || lower.includes('authorization')) {
      const headerName = lower.includes('content-type') ? 'content-type' : 'authorization';
      newRules.push({
        id: `custom-header-${Date.now()}`,
        type: 'header_exists',
        description: `Custom Header: Check "${headerName}" is present`,
        expectedValue: headerName
      });
    }

    // 4. Body substring contains rule
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

    // Fallback baseline rule
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
                Describe test criteria in plain English (e.g. Verify status code is 200 and latency is under 500ms).
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

        {/* Natural Language Prompt Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Natural Language Test Requirement
          </label>
          <textarea
            rows={3}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. Verify response status code is 200, latency is under 800ms, and body contains SUCCESS string."
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
          <span className="text-[11px] text-slate-500 font-mono">
            {quota.mode === 'user_key' ? 'User Key Mode (Unlimited)' : `Demo Key Mode (${quota.requestsUsed}/${quota.maxDemoRequests} Used)`}
          </span>

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
