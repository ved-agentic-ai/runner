'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileJson, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { PostmanCollection, PostmanEnvironment } from '@/lib/types';

export const UploadZone: React.FC = () => {
  const { loadCollection, loadDemoCollection } = useRunnerStore();
  
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
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-indigo-400 shrink-0" />
            Collection & Environment Upload Zone
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag and drop your Postman Collection JSON (v2.0/v2.1) and optional Environment variables.
          </p>
        </div>

        {/* Quick Demo Preset Button */}
        <button
          onClick={loadDemoCollection}
          className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/30 px-3.5 py-1.5 text-xs font-semibold text-purple-200 hover:from-purple-600/50 hover:to-indigo-600/50 hover:border-purple-400/50 transition-all shadow-md shrink-0 whitespace-nowrap"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-300 animate-pulse shrink-0" />
          <span>Quick Start with Demo APIs</span>
          <ArrowRight className="h-3 w-3 opacity-70 shrink-0" />
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 rounded-lg bg-red-950/50 border border-red-800/60 p-2.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border-2 border-dashed p-4 transition-all ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.005]' 
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
        }`}
      >
        {/* Postman Collection Box */}
        <div 
          onClick={() => collectionInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all"
        >
          <input
            ref={collectionInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleCollectionFileSelect(e.target.files[0])}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <FileJson className="h-5 w-5" />
          </div>
          <span className="mt-2 text-xs font-semibold text-slate-200">
            {collectionFile ? collectionFile.name : 'Postman Collection (.json)'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {collectionFile ? 'Click to change file' : 'Drag & drop or click to browse'}
          </span>
          {parsedCollection && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" /> Ready: {parsedCollection.item?.length || 0} Folders/Items
            </span>
          )}
        </div>

        {/* Postman Environment Box */}
        <div 
          onClick={() => envInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 text-center cursor-pointer hover:border-purple-500/50 hover:bg-slate-900/80 transition-all"
        >
          <input
            ref={envInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleEnvFileSelect(e.target.files[0])}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
            <Sliders className="h-5 w-5" />
          </div>
          <span className="mt-2 text-xs font-semibold text-slate-200">
            {envFile ? envFile.name : 'Environment Variables (.json)'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {envFile ? 'Click to change file' : 'Optional environment file'}
          </span>
          {parsedEnv && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-950/80 px-2.5 py-0.5 text-[10px] font-medium text-purple-300 ring-1 ring-purple-500/30">
              <CheckCircle2 className="h-3 w-3" /> {parsedEnv.values?.length || 0} Variables Loaded
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
