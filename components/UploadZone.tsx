'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileJson, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { PostmanCollection, PostmanEnvironment } from '@/lib/types';

export const UploadZone: React.FC = () => {
  const { loadCollection, loadDemoCollection } = useRunnerStore();
  const { showCapabilitiesGrid } = useAdminStore();
  
  const [collectionFile, setCollectionFile] = useState<File | null>(null);
  const [envFile, setEnvFile] = useState<File | null>(null);
  const [parsedCollection, setParsedCollection] = useState<PostmanCollection | null>(null);
  const [parsedEnv, setParsedEnv] = useState<PostmanEnvironment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const collectionInputRef = useRef<HTMLInputElement>(null);
  const envInputRef = useRef<HTMLInputElement>(null);

  const handleCollectionFileSelect = (file: File) => {
    setErrorMsg(null);
    if (!file.name.endsWith('.json')) {
      setErrorMsg('Please select a valid .json Postman Collection file.');
      return;
    }
    setCollectionFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.item && !json.info) {
          throw new Error('Invalid Postman Collection schema (missing item or info field)');
        }
        setParsedCollection(json);
        loadCollection(json, parsedEnv || undefined);
      } catch (err: any) {
        setErrorMsg(`Failed to parse collection JSON: ${err.message}`);
        setCollectionFile(null);
        setParsedCollection(null);
      }
    };
    reader.readAsText(file);
  };

  const handleEnvFileSelect = (file: File) => {
    setErrorMsg(null);
    setEnvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setParsedEnv(json);
        if (parsedCollection) {
          loadCollection(parsedCollection, json);
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse environment JSON: ${err.message}`);
        setEnvFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const cFile = files.find(f => f.name.toLowerCase().includes('collection') || f.name.endsWith('.json'));
      const eFile = files.find(f => f.name.toLowerCase().includes('environment') || f.name.toLowerCase().includes('env'));

      if (cFile) handleCollectionFileSelect(cFile);
      if (eFile && eFile !== cFile) handleEnvFileSelect(eFile);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Box Container */}
      <div className="w-full rounded-3xl border border-slate-800 bg-[#0f172a]/90 p-6 backdrop-blur-md shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-indigo-400 shrink-0" />
              Collection & Environment Upload Zone
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag and drop your Postman Collection JSON (v2.0/v2.1) and optional Environment variables.
            </p>
          </div>

          {/* Quick Demo Preset Button */}
          <button
            onClick={loadDemoCollection}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/30 px-4 py-2 text-xs font-bold text-purple-200 hover:from-purple-600/50 hover:to-indigo-600/50 hover:border-purple-400/50 transition-all shadow-md shrink-0 whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 text-purple-300 animate-pulse shrink-0" />
            <span>Quick Start with Demo APIs</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-70 shrink-0" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-950/50 border border-red-800/60 p-3 text-xs font-semibold text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`grid grid-cols-1 md:grid-cols-2 gap-5 rounded-2xl border-2 border-dashed p-6 transition-all ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-950/20 scale-[1.005]' 
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}
        >
          {/* Postman Collection Box */}
          <div 
            onClick={() => collectionInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all"
          >
            <input
              ref={collectionInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleCollectionFileSelect(e.target.files[0])}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <FileJson className="h-6 w-6" />
            </div>
            <span className="mt-3 text-xs font-bold text-slate-200">
              {collectionFile ? collectionFile.name : 'Postman Collection (.json)'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              {collectionFile ? 'Click to change file' : 'Drag & drop or click to browse'}
            </span>
            {parsedCollection && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-3 py-1 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready: {parsedCollection.item?.length || 0} Folders/Items
              </span>
            )}
          </div>

          {/* Postman Environment Box */}
          <div 
            onClick={() => envInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center cursor-pointer hover:border-purple-500/50 hover:bg-slate-900/80 transition-all"
          >
            <input
              ref={envInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleEnvFileSelect(e.target.files[0])}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Sliders className="h-6 w-6" />
            </div>
            <span className="mt-3 text-xs font-bold text-slate-200">
              {envFile ? envFile.name : 'Environment Variables (.json)'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              {envFile ? 'Click to change file' : 'Optional environment file'}
            </span>
            {parsedEnv && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-purple-950/80 px-3 py-1 text-[10px] font-bold text-purple-300 ring-1 ring-purple-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> {parsedEnv.values?.length || 0} Variables Loaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Professional SaaS Core Capability Highlights Grid (Configurable via Admin Toggle) */}
      {showCapabilitiesGrid && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
          {[
            {
              icon: Zap,
              color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
              title: 'Instant AI Test Generation',
              desc: 'Synthesizes HTTP status, SLA latency, header, and JSON schema assertions automatically.'
            },
            {
              icon: ShieldCheck,
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              title: '100% Zero-Trust Privacy',
              desc: 'Secrets are masked locally before AI script generation and never sent over external wires.'
            },
            {
              icon: Globe,
              color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              title: 'CORS-Free Proxy Runner',
              desc: 'Next.js serverless proxy route executes requests server-side bypassing browser restrictions.'
            },
            {
              icon: SlidersHorizontal,
              color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              title: 'Custom AI Rules Vault',
              desc: 'Type natural language rules applied globally or to targeted endpoint scopes.'
            }
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs text-white">{item.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
