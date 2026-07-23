'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  UploadCloud, 
  Play, 
  Sparkles, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Terminal, 
  Presentation, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  FileCode, 
  ChevronRight,
  RefreshCw,
  FolderPlus
} from 'lucide-react';

interface InteractiveUserGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const InteractiveUserGuideModal: React.FC<InteractiveUserGuideModalProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [simState, setSimState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simProgress, setSimProgress] = useState(0);

  // Run Step 4 Execution Simulation
  const handleRunSimulation = () => {
    setSimState('running');
    setSimProgress(10);
    setSimLogs(['[Sim Engine] Initializing zero-trust client proxy...']);

    setTimeout(() => {
      setSimProgress(35);
      setSimLogs(prev => [...prev, '[Sim Engine] GET https://jsonplaceholder.typicode.com/posts/1 -> 200 OK (38ms) [PASS]']);
    }, 600);

    setTimeout(() => {
      setSimProgress(70);
      setSimLogs(prev => [...prev, '[Sim Engine] POST https://reqres.in/api/users -> 201 Created (124ms) [PASS]']);
    }, 1200);

    setTimeout(() => {
      setSimProgress(100);
      setSimState('completed');
      setSimLogs(prev => [...prev, '[Sim Engine] Execution complete! 2/2 Passed, SLA 81ms avg. 100% assertions satisfied.']);
    }, 1800);
  };

  const steps = [
    { id: 1, label: '📤 1. Import Collection', icon: UploadCloud },
    { id: 2, label: '🔑 2. Secrets & Env', icon: Lock },
    { id: 3, label: '🪄 3. AI Assertion Engine', icon: Sparkles },
    { id: 4, label: '🚀 4. Live Execution Simulation', icon: Play },
    { id: 5, label: '📊 5. Reports & PPT Decks', icon: Presentation },
  ];

  const content = (
    <div className={`w-full rounded-3xl border border-indigo-500/30 bg-[#0f172a]/95 p-6 backdrop-blur-md shadow-2xl space-y-6 text-left overflow-hidden ${isEmbedded ? '' : 'max-w-4xl mx-auto my-auto'}`}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              Interactive User Manual & Live Execution Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step-by-step interactive walkthrough demonstrating zero-trust secret masking, AI assertion synthesis, and proxy execution.
            </p>
          </div>
        </div>

        {!isEmbedded && onClose && (
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Step Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto custom-scrollbar">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center space-x-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: IMPORT POSTMAN COLLECTION */}
      {activeStep === 1 && (
        <div className="space-y-5 text-xs text-slate-300 animate-in fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-indigo-400" /> Step 1: Importing Postman Collections & Environments
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Drag and drop your exported Postman Collection (v2.0 or v2.1 JSON) or Postman Environment file into the upload zone. The application automatically parses folder hierarchies, requests, query parameters, auth headers, and body payloads in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-indigo-300 block">Drag & Drop Upload Zone</span>
              <p className="text-slate-400 text-[11px]">
                Accepts <code className="text-indigo-300">.json</code> Postman Collection files up to 50MB. Instantly builds a hierarchical tree view in Tab 2.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-900/60 bg-purple-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-purple-300 block">Featured Demo Suites</span>
              <p className="text-slate-400 text-[11px]">
                Click <strong>"Load Demo API Collection"</strong> in the top toolbar to pre-load a 16-endpoint REST suite testing GET/POST/PUT/DELETE APIs immediately!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SECRETS & ENVIRONMENT VARIABLES */}
      {activeStep === 2 && (
        <div className="space-y-5 text-xs text-slate-300 animate-in fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-400" /> Step 2: Zero-Trust Local Secret Isolation & Environment Manager
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Before sending endpoint specs to AI for automated test assertion generation, sensitive secrets (JWTs, passwords, Bearer tokens) are pre-sanitized in client memory into <code className="text-emerald-300">&#123;&#123;REDACTED_SECRET_LOCAL_ONLY&#125;&#125;</code> placeholders. Actual secrets are substituted locally right before sending fetch requests to the CORS proxy gateway!
            </p>
          </div>

          {/* Interactive Masking Visualizer */}
          <div className="rounded-2xl border border-emerald-900/60 bg-slate-950 p-4 space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 font-sans">
              <span>Interactive Secret Masking Demonstration:</span>
              <span className="rounded bg-emerald-950 px-2 py-0.5 border border-emerald-800 text-[10px]">100% Client Isolation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
                <span className="text-red-400 font-sans font-semibold text-[10px] block">Raw Client Request (In Memory Only):</span>
                <p className="text-slate-300">Authorization: Bearer secret_token_xyz123</p>
                <p className="text-slate-300">"password": "MySuperSecretPassword!"</p>
              </div>

              <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 space-y-1">
                <span className="text-emerald-400 font-sans font-semibold text-[10px] block">Sanitized Sent to AI LLM Over Wire:</span>
                <p className="text-emerald-300">Authorization: Bearer &#123;&#123;REDACTED&#125;&#125;</p>
                <p className="text-emerald-300">"password": "&#123;&#123;REDACTED&#125;&#125;"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AI ASSERTION ENGINE */}
      {activeStep === 3 && (
        <div className="space-y-5 text-xs text-slate-300 animate-in fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> Step 3: AI Assertion Generation & Smart Local Fallback
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              When you load a collection or click <strong>"+ Custom AI Test Generator"</strong>, Google Gemini 1.5 Flash analyzes endpoint parameters and generates automated test contracts (Status 20x, SLA latency &lt;2000ms, Header checks, JSON schema validation). If quota is exceeded, the app seamlessly switches to the 100% offline local heuristic rule engine!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-purple-900/60 bg-purple-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-purple-300 block">1. Status & SLA Assertions</span>
              <p className="text-slate-400 text-[11px]">Validates HTTP 200/201 response status codes and enforces p95 response time SLAs.</p>
            </div>

            <div className="rounded-2xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-indigo-300 block">2. Header & Schema Rules</span>
              <p className="text-slate-400 text-[11px]">Checks required response headers (`content-type`) and validates JSON schema structures.</p>
            </div>

            <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-amber-300 block">3. Mainframe Text Parsing</span>
              <p className="text-slate-400 text-[11px]">Legacy Mainframe `text/plain` payloads are parsed and validated cleanly without throwing JSON errors.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: LIVE EXECUTION SIMULATION */}
      {activeStep === 4 && (
        <div className="space-y-5 text-xs text-slate-300 animate-in fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-indigo-400" /> Interactive Execution Engine Simulation
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Click below to simulate running a high-concurrency API test suite through the serverless CORS proxy gateway.
                </p>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={simState === 'running'}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 shrink-0"
              >
                <Play className={`h-4 w-4 ${simState === 'running' ? 'animate-spin' : ''}`} />
                <span>{simState === 'running' ? 'Executing Suite...' : 'Run Simulated Test Suite'}</span>
              </button>
            </div>

            {/* Simulated Progress Bar */}
            {simState !== 'idle' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <span>Execution Progress: {simProgress}%</span>
                  <span>{simState === 'completed' ? 'Done' : 'Running...'}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${simProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Terminal Simulation Log Window */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-[11px] space-y-2 min-h-36 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="flex items-center space-x-2 text-slate-500 border-b border-slate-800 pb-1 text-[10px]">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                <span>Live Execution Terminal Stream</span>
              </div>
              {simLogs.length === 0 ? (
                <p className="text-slate-500 italic">Click "Run Simulated Test Suite" above to launch interactive execution...</p>
              ) : (
                simLogs.map((log, idx) => (
                  <p key={idx} className={log.includes('[PASS]') ? 'text-emerald-300' : 'text-slate-300'}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REPORTS & PPT DECKS */}
      {activeStep === 5 && (
        <div className="space-y-5 text-xs text-slate-300 animate-in fade-in">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Presentation className="h-5 w-5 text-amber-400" /> Step 5: Live Telemetry & Executive Presentation Deck Export
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Once execution completes, view real-time SLA metrics, min/max/avg latency graphs, pass/fail ratios, and generate executive PowerPoint deck presentations (`.pptx`) for QA leads and stakeholders in 1 click!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-amber-300 block">Stakeholder PPT Deck Generator</span>
              <p className="text-slate-400 text-[11px]">
                Click <strong>"💻 Stakeholder PPT"</strong> in the top header bar to preview and download a 10-slide executive presentation deck!
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-2">
              <span className="font-bold text-xs text-indigo-300 block">Custom Rules Vault</span>
              <p className="text-slate-400 text-[11px]">
                Navigate to <strong>Tab 3 (Custom AI Rules Vault)</strong> to manage natural language test rule targeted to Global, Folder, or Endpoint scopes!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isEmbedded) return content;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      {content}
    </div>,
    document.body
  );
};
