'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wand2, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Folder, 
  Target,
  Sparkles,
  Zap
} from 'lucide-react';

export const RuleGeneratorSimulationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [simStep, setSimStep] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const simulationSteps = [
    {
      step: 1,
      title: '1. Natural Language Prompt Input',
      desc: 'The user enters test criteria in plain English without writing any JavaScript or post-response test code.',
      example: '"Verify rate limit returns HTTP 429, gateway timeout returns HTTP 504, and latency is under 300ms."',
      badge: 'Natural Language Input'
    },
    {
      step: 2,
      title: '2. AI & Pattern Rule Compilation Engine',
      desc: 'The engine parses intent and generates structured TestCaseRule objects with exact assertion rules.',
      compiledRules: [
        { type: 'status_code', desc: 'Validate response HTTP 429 Too Many Requests', expected: '429' },
        { type: 'status_code', desc: 'Validate response HTTP 504 Gateway Timeout', expected: '504' },
        { type: 'latency_sla', desc: 'Ensure response latency meets SLA', expected: '<= 300ms' }
      ],
      badge: 'Structured Test Compilation'
    },
    {
      step: 3,
      title: '3. Application Scope Routing (Global / Folder / Endpoint)',
      desc: 'The compiled test rules are applied to the chosen target scope without mutating other collections.',
      scopeExamples: [
        { label: '🌐 Global Scope', text: 'Applies to all 24 endpoints in collection' },
        { label: '📁 Folder Scope', text: 'Applies only to /Auth or /MainframeEndpoints folder' },
        { label: '🎯 Endpoint Scope', text: 'Applies strictly to 1 selected HTTP endpoint' }
      ],
      badge: 'Scope Targeted Deployment'
    }
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Custom AI Test Generator Interactive Simulation
              </h2>
              <p className="text-xs text-slate-400">
                Visual walkthrough explaining how natural language compiles into executable API test assertions.
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

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {simulationSteps.map((s) => (
            <button
              key={s.step}
              onClick={() => setSimStep(s.step)}
              className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                simStep === s.step
                  ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300 shadow-md'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>Step {s.step}</span>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">
              {simulationSteps[simStep - 1].title}
            </h3>
            <span className="rounded bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 text-[10px] font-bold">
              {simulationSteps[simStep - 1].badge}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {simulationSteps[simStep - 1].desc}
          </p>

          {/* Step 1 Visual Example */}
          {simStep === 1 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2 font-mono text-xs text-indigo-300">
              <span className="text-[10px] uppercase font-bold text-slate-400">User English Input:</span>
              <p className="italic text-slate-200">
                {simulationSteps[0].example}
              </p>
            </div>
          )}

          {/* Step 2 Visual Example */}
          {simStep === 2 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Compiled Rule Output:</span>
              <div className="space-y-2">
                {simulationSteps[1].compiledRules?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs">
                    <span className="font-semibold text-slate-200">{r.desc}</span>
                    <span className="rounded bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 font-mono text-[10px]">
                      Expected: {r.expected}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 Visual Example */}
          {simStep === 3 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Application Scopes:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {simulationSteps[2].scopeExamples?.map((sc, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
                    <span className="font-bold text-indigo-300 text-xs">{sc.label}</span>
                    <p className="text-[11px] text-slate-400">{sc.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Interactive Rule Walkthrough Simulation
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Got It! Close Simulation
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1 text-slate-400 hover:text-indigo-400 text-xs font-medium transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span>How it works? (Simulation)</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
