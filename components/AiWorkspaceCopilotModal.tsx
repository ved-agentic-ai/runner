'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

interface AiWorkspaceCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiWorkspaceCopilotModal: React.FC<AiWorkspaceCopilotModalProps> = ({ isOpen, onClose }) => {
  const { 
    flatEndpointMap, 
    selectedNodeIds, 
    executionResults, 
    envVariables,
    collectionName,
    serverCollectionName,
    setSelectedEndpointIdForDetail
  } = useRunnerStore();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; data?: any }>>([
    {
      sender: 'assistant',
      text: `👋 Hello! I am your **AI Workspace Assistant**. Ask me any question about your active API collection, endpoints, execution error root causes, headers, or telemetry metrics!\n\nTry asking one of the examples below:`
    }
  ]);

  if (!isOpen || typeof document === 'undefined') return null;

  const resultsList = Object.values(executionResults);
  const totalEndpoints = flatEndpointMap.size;
  const totalExecuted = resultsList.length;
  const passedCount = resultsList.filter((r) => r.status === 'passed').length;
  const failedCount = resultsList.filter((r) => r.status === 'failed').length;

  const quickQuestions = [
    "How many requests failed due to missing app-key header?",
    "List all POST endpoints in the active workspace",
    "Which endpoints returned 404 Not Found error?",
    "Show summary of response time and SLA bottlenecks",
    "What environment variables are currently configured?"
  ];

  const handleAskQuestion = async (userQuestion: string) => {
    if (!userQuestion.trim()) return;

    const newMsgList = [...messages, { sender: 'user' as const, text: userQuestion }];
    setMessages(newMsgList);
    setQuery('');
    setLoading(true);

    // Context preparation for AI
    const qLower = userQuestion.toLowerCase();
    let answerText = '';
    let matchesData: any = null;

    // Rule-based high-accuracy NLP Intent Engine + Gemini AI
    if (qLower.includes('missing') || qLower.includes('app-key') || qLower.includes('header')) {
      const missingHeaderFailures = resultsList.filter((res) => {
        const bodyStr = res.responseBody ? String(res.responseBody).toLowerCase() : '';
        return bodyStr.includes('missing app-key') || bodyStr.includes('header') || res.statusCode === 400;
      });

      answerText = `### 🔍 Analysis: Missing Header Failures\n\nFound **${missingHeaderFailures.length} endpoints** that failed or returned HTTP 400 due to header configuration issue:\n\n` +
        missingHeaderFailures.map((m) => `- **[${m.method}] ${m.name}**: HTTP ${m.statusCode} - \`${m.resolvedUrl}\``).join('\n') +
        `\n\n💡 **Recommendation**: Open **Request & Headers** tab in Endpoint Inspector for these endpoints and add header \`app-key\` = \`{{internal-service-app-key}}\`.`;
      matchesData = missingHeaderFailures;
    } else if (qLower.includes('404') || qLower.includes('not found')) {
      const notFoundFailures = resultsList.filter((res) => res.statusCode === 404);
      answerText = `### ❌ Endpoints with 404 Not Found (${notFoundFailures.length} total)\n\n` +
        (notFoundFailures.length > 0 
          ? notFoundFailures.map((m) => `- **[${m.method}] ${m.name}**: \`${m.resolvedUrl}\``).join('\n')
          : `No endpoints returned 404 Not Found status.`);
      matchesData = notFoundFailures;
    } else if (qLower.includes('post')) {
      const postEndpoints = Array.from(flatEndpointMap.values()).filter((n) => n.type === 'endpoint' && n.method === 'POST');
      answerText = `### 📤 POST Method Endpoints (${postEndpoints.length} total)\n\n` +
        postEndpoints.map((n) => `- **${n.name}**: \`${n.url || 'No URL'}\``).join('\n');
      matchesData = postEndpoints;
    } else if (qLower.includes('env') || qLower.includes('variable')) {
      const entries = Object.entries(envVariables);
      answerText = `### 🔑 Workspace Environment Variables (${entries.length} active)\n\n` +
        (entries.length > 0
          ? entries.map(([k, v]) => `- \`{{${k}}}\` = \`${v.length > 25 ? v.substring(0, 25) + '...' : v}\``).join('\n')
          : `No environment variables currently configured.`);
    } else if (qLower.includes('summary') || qLower.includes('sla') || qLower.includes('latency')) {
      const avgLatency = resultsList.length > 0 ? Math.round(resultsList.reduce((acc, r) => acc + (r.responseTimeMs || 0), 0) / resultsList.length) : 0;
      answerText = `### 📊 Live Workspace Telemetry Summary\n\n- **Active Collection**: \`${collectionName || serverCollectionName || 'Default Workspace'}\`\n- **Total Endpoints**: **${totalEndpoints}** (${selectedNodeIds.length} Selected)\n- **Executed**: **${totalExecuted}** (${passedCount} Passed, ${failedCount} Failed)\n- **Average Latency**: **${avgLatency} ms**`;
    } else {
      // Gemini API AI Response
      try {
        const workspaceSummary = {
          collection: collectionName || serverCollectionName,
          totalEndpoints,
          executedCount: totalExecuted,
          passedCount,
          failedCount,
          envKeys: Object.keys(envVariables),
          sampleFailures: resultsList.filter(r => r.status === 'failed').slice(0, 5).map(r => ({
            name: r.name,
            code: r.statusCode,
            url: r.resolvedUrl
          }))
        };

        const res = await fetch('/api/proxy-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            method: 'POST',
            headers: {},
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are an expert API Testing AI Assistant. Answer the user prompt directly based on this workspace data: ${JSON.stringify(workspaceSummary)}. User Prompt: "${userQuestion}". Keep response clear, precise, and markdown formatted.`
                }]
              }]
            })
          })
        });

        const aiData = await res.json();
        if (aiData.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          answerText = aiData.data.candidates[0].content.parts[0].text;
        } else {
          answerText = `### 🤖 Workspace Assistant Query Result\n\nYour workspace currently contains **${totalEndpoints} endpoints** (${selectedNodeIds.length} selected for execution). \n\n- **Passed**: ${passedCount}\n- **Failed**: ${failedCount}\n\nPlease select an endpoint to inspect detailed headers or re-run requests.`;
        }
      } catch (err) {
        answerText = `Workspace query completed: **${totalEndpoints} total endpoints**, **${passedCount} passed**, **${failedCount} failed**.`;
      }
    }

    setLoading(false);
    setMessages((prev) => [...prev, { sender: 'assistant', text: answerText, data: matchesData }]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl h-[85vh] flex flex-col rounded-3xl border border-indigo-500/30 bg-[#0b1329] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                🤖 AI Workspace Copilot & NLP Assistant
              </h3>
              <p className="text-xs text-slate-400">
                Ask any question about endpoints, failure reasons, headers, or environment variables.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}

              <div className={`rounded-2xl p-4 text-xs max-w-xl space-y-2 leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white font-medium shadow-lg' 
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}>
                <div className="prose prose-invert prose-xs max-w-none">
                  {msg.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className="m-0 leading-relaxed">{line}</p>
                  ))}
                </div>

                {/* Clickable endpoint chips if available */}
                {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {msg.data.map((item: any) => (
                      <button
                        key={item.endpointId || item.id}
                        onClick={() => {
                          setSelectedEndpointIdForDetail(item.endpointId || item.id);
                          onClose();
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-700 transition-all"
                      >
                        <span className="font-bold text-emerald-400">{item.method || 'GET'}</span>
                        <span className="truncate max-w-[150px]">{item.name}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold p-3 bg-slate-900/40 rounded-2xl border border-slate-800 w-fit">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>AI is analyzing workspace telemetry & endpoints...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex items-center space-x-2 custom-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Suggestions:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 hover:border-indigo-500 hover:text-indigo-300 whitespace-nowrap shrink-0 transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-3 shrink-0">
          <input
            type="text"
            placeholder="Ask AI anything about your API workspace (e.g. missing headers, 404 errors)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion(query)}
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => handleAskQuestion(query)}
            disabled={!query.trim() || loading}
            className="inline-flex items-center space-x-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ask AI</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
