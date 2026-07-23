'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  FolderPlus, 
  Play, 
  CheckSquare, 
  Presentation, 
  Sparkles,
  ArrowRight,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

interface StepByStepClickGuideProps {
  onNavigateTab?: (tab: 'upload' | 'runner' | 'vault' | 'architecture') => void;
}

export const StepByStepClickGuide: React.FC<StepByStepClickGuideProps> = ({
  onNavigateTab
}) => {
  const { loadDemoCollection, selectAllNodes, runSelectedEndpoints } = useRunnerStore();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [actionDoneMsg, setActionDoneMsg] = useState<string | null>(null);

  const triggerAction = (stepId: number) => {
    if (stepId === 1) {
      loadDemoCollection();
      setActionDoneMsg('✅ Demo API Collection Loaded Successfully!');
    } else if (stepId === 2) {
      if (onNavigateTab) onNavigateTab('runner');
      setActionDoneMsg('✅ Navigated to 🚀 2. Runner & Live Telemetry Workspace!');
    } else if (stepId === 3) {
      selectAllNodes();
      setActionDoneMsg('✅ Selected All 16 Endpoints in Tree View!');
    } else if (stepId === 4) {
      if (onNavigateTab) onNavigateTab('runner');
      runSelectedEndpoints();
      setActionDoneMsg('✅ Execution Started! Check Telemetry Dashboard!');
    } else if (stepId === 5) {
      setActionDoneMsg('✅ Click "💻 Stakeholder PPT" in the top bar to export slides!');
    }

    setTimeout(() => {
      setActionDoneMsg(null);
    }, 2500);
  };

  const steps = [
    {
      id: 1,
      stepNum: 'Step 1',
      title: '📁 Load or Upload API Collection',
      whereToClick: 'Click "📁 Load Demo API Collection" in sub-header bar or drag Postman JSON file',
      whatToDo: 'Imports endpoints, headers, and request bodies into application state.',
      btnLabel: 'Click Here: Load Demo Collection Now',
      icon: FolderPlus,
      color: 'from-purple-500 to-indigo-600',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },
    {
      id: 2,
      stepNum: 'Step 2',
      title: '🚀 Switch to Runner Workspace',
      whereToClick: 'Click "🚀 2. Runner & Live Telemetry" tab in top navigation bar',
      whatToDo: 'Opens the high-concurrency execution engine and live SLA telemetry dashboard.',
      btnLabel: 'Click Here: Open Runner Workspace',
      icon: Play,
      color: 'from-indigo-500 to-blue-600',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    },
    {
      id: 3,
      stepNum: 'Step 3',
      title: '☑️ Select Endpoints to Execute',
      whereToClick: 'Check endpoint boxes in left tree menu or click "Select All"',
      whatToDo: 'Queues up chosen GET, POST, PUT, DELETE requests for execution.',
      btnLabel: 'Click Here: Select All 16 Endpoints',
      icon: CheckSquare,
      color: 'from-blue-500 to-cyan-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    },
    {
      id: 4,
      stepNum: 'Step 4',
      title: '▶ Execute Test Suite & View Telemetry',
      whereToClick: 'Click big purple "▶ Run Selected (X Endpoints)" button in runner panel',
      whatToDo: 'Executes requests server-side bypassing CORS with real-time pass/fail assertions.',
      btnLabel: 'Click Here: Run Test Suite Now',
      icon: Zap,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    {
      id: 5,
      stepNum: 'Step 5',
      title: '💻 Export Stakeholder PPT Decks',
      whereToClick: 'Click "💻 Stakeholder PPT" in top bar or click any row for raw HTTP logs',
      whatToDo: 'Downloads 10-slide PowerPoint presentations and inspects response assertions.',
      btnLabel: 'Click Here: View PPT Export Instructions',
      icon: Presentation,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  ];

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 p-5 shadow-2xl space-y-4 animate-in fade-in">
      
      {/* Header Title & Expand / Collapse Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-900/40 pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/20">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3 w-3 fill-current text-indigo-400" />
                <span>Interactive Quick Start Guide</span>
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-white mt-0.5">
              Step-by-Step Instructions: Where to Click & How to Run Tests
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actionDoneMsg && (
            <span className="rounded-xl bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-800 animate-in fade-in">
              {actionDoneMsg}
            </span>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <span>{isCollapsed ? 'Expand Guide' : 'Collapse Guide'}</span>
            {isCollapsed ? <ChevronDown className="h-4 w-4 text-indigo-400" /> : <ChevronUp className="h-4 w-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activeStep === s.id
                    ? 'border-indigo-500 bg-indigo-950/60 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 border ${s.badgeColor}`}>
                    {s.stepNum}
                  </span>
                  <s.icon className={`h-4 w-4 ${activeStep === s.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <span className={`block font-bold text-xs mt-2 truncate ${activeStep === s.id ? 'text-white' : 'text-slate-300'}`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Active Step Detailed Card */}
          {(() => {
            const current = steps.find(s => s.id === activeStep) || steps[0];
            const Icon = current.icon;
            return (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${current.color} text-white shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{current.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{current.whatToDo}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerAction(current.id)}
                    className={`inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r ${current.color} px-4 py-2 text-xs font-extrabold text-white shadow-lg hover:brightness-110 transition-all shrink-0`}
                  >
                    <span>{current.btnLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-indigo-400" /> 1. Where Exactly to Click:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed font-mono">
                      {current.whereToClick}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-emerald-400" /> 2. What System Does Next:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {current.whatToDo}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

    </div>
  );
};
