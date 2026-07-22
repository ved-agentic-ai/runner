'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Cpu, 
  Server, 
  RefreshCw,
  Play
} from 'lucide-react';

export const PrivacySimulationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [customSecret, setCustomSecret] = useState('super_secret_apiKey_98765');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    {
      id: 1,
      title: '1. Secret Storage (Local Only)',
      icon: Lock,
      badge: 'Client Memory',
      description: 'Your uploaded environment variables & secret tokens are stored strictly in client-side browser memory.',
      codeSnippet: `// Stored ONLY in your local browser state:
const envVariables = {
  baseUrl: "https://api.company.com",
  apiKey: "${customSecret}", // 🔒 Sensitive Secret
  authToken: "eyJhbGciOiJIUzI1Ni..." // 🔒 Sensitive Secret
};`
    },
    {
      id: 2,
      title: '2. Local Masking & Sanitization',
      icon: EyeOff,
      badge: 'Local Sanitizer',
      description: 'Before test generation, all secret values and sensitive header strings are stripped and masked into local variable placeholders.',
      codeSnippet: `// Data prepared before sending to AI:
const sanitizedSpec = {
  url: "{{baseUrl}}/users/profile",
  headers: [
    { key: "Authorization", value: "Bearer {{REDACTED_SECRET_LOCAL_ONLY}}" }
  ],
  requestBody: { "apiKey": "{{REDACTED_SECRET_LOCAL_ONLY}}" }
};`
    },
    {
      id: 3,
      title: '3. AI Test Script Generation',
      icon: Cpu,
      badge: 'LLM Wire Payload',
      description: 'The AI receives ONLY structural metadata (HTTP method, endpoint paths, and generic placeholders). ZERO secrets are sent to external servers.',
      codeSnippet: `// What the AI LLM actually receives over the wire:
"Analyze endpoint GET {{baseUrl}}/users/profile. Generate status, SLA, and JSON schema assertion rules."
// Result: 0 Secrets transmitted to LLM!`
    },
    {
      id: 4,
      title: '4. Local Runner Execution Proxy',
      icon: Server,
      badge: 'Localhost Proxy',
      description: 'When running tests, secret values are substituted strictly on your local machine (http://localhost:3000/api/proxy-request).',
      codeSnippet: `// Request executed on local dev proxy:
fetch("https://api.company.com/users/profile", {
  headers: { "Authorization": "Bearer " + envVariables.authToken }
}); // Executed directly from your server to target API`
    }
  ];

  const currentStep = steps.find(s => s.id === activeStep) || steps[0];

  const handleAutoPlay = () => {
    setIsPlaying(true);
    setActiveStep(1);
    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step > 4) {
        clearInterval(interval);
        setIsPlaying(false);
      } else {
        setActiveStep(step);
      }
    }, 2200);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Secret Isolation & Privacy Simulation
              </h2>
              <p className="text-xs text-slate-400">
                See step-by-step how your API keys and secrets stay 100% local on your device.
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

        {/* Interactive Live Secret Test Input */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Test Secret Variable Sanitizer Simulator
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={customSecret}
              onChange={(e) => setCustomSecret(e.target.value)}
              placeholder="Enter any secret key (e.g. sk_live_12345)..."
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400">
              <span>Sanitized Output:</span>
              <span className="text-purple-400 font-bold">REDACTED_SECRET</span>
            </div>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-[11px] font-semibold truncate w-full">Step {step.id}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {currentStep.title}
            </h3>
            <span className="rounded-full bg-emerald-950 border border-emerald-700/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              {currentStep.badge}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Code Visualizer */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs overflow-x-auto">
            <pre className="text-emerald-300 leading-relaxed">
              {currentStep.codeSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Controls Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={handleAutoPlay}
            disabled={isPlaying}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 rounded-xl bg-purple-950/80 px-3.5 py-2 text-xs font-semibold text-purple-300 border border-purple-800/60 hover:bg-purple-900 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${isPlaying ? 'animate-spin' : ''}`} />
            <span>{isPlaying ? 'Simulating Workflow...' : 'Auto-Play Simulation'}</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep(activeStep - 1)}
                className="rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Previous
              </button>
            )}
            {activeStep < 4 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Close Simulation
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Simulation Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 hover:border-emerald-500 transition-all shadow-md active:scale-95 whitespace-nowrap"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Privacy Interactive Simulation</span>
        <Play className="h-3 w-3 fill-current text-emerald-400 shrink-0 ml-0.5" />
      </button>

      {/* Render via React Portal directly into document.body */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
