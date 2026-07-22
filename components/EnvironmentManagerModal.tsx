'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  Lock,
  FileCode
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';

interface EnvVarEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret: boolean;
}

export const EnvironmentManagerModal: React.FC = () => {
  const { envVariables, loadCollection, collectionName, rootNodes } = useRunnerStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<EnvVarEntry[]>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when opening modal
  useEffect(() => {
    if (isOpen) {
      const initialEntries: EnvVarEntry[] = Object.entries(envVariables).map(([key, value], idx) => ({
        id: `env-${idx}-${key}`,
        key,
        value,
        enabled: true,
        isSecret: /key|secret|token|password|auth/i.test(key)
      }));
      if (initialEntries.length === 0) {
        initialEntries.push({
          id: 'env-0',
          key: 'baseUrl',
          value: 'https://jsonplaceholder.typicode.com',
          enabled: true,
          isSecret: false
        });
      }
      setEntries(initialEntries);
    }
  }, [isOpen, envVariables]);

  const handleAddRow = () => {
    setEntries([
      ...entries,
      {
        id: `env-${Date.now()}`,
        key: '',
        value: '',
        enabled: true,
        isSecret: false
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof EnvVarEntry, val: any) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: val };
        if (field === 'key') {
          updated.isSecret = /key|secret|token|password|auth/i.test(val);
        }
        return updated;
      }
      return e;
    }));
  };

  const toggleShowValue = (id: string) => {
    setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    const updatedEnv: Record<string, string> = {};
    entries.forEach(e => {
      if (e.enabled && e.key.trim().length > 0) {
        updatedEnv[e.key.trim()] = e.value;
      }
    });

    // Update Zustand store
    useRunnerStore.setState({ envVariables: updatedEnv });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsOpen(false);
    }, 1200);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl flex flex-col space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Environment Variables Manager
              </h2>
              <p className="text-xs text-slate-400">
                Configure local keys, secret tokens, and target base URLs (Postman style). All values stay 100% strictly local.
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

        {/* Security Reassurance Pill */}
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 p-3 text-xs text-emerald-300">
          <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Local Confidentiality:</strong> Secrets configured here are substituted strictly during execution on your local machine proxy and are NEVER sent to LLMs or third parties.
          </span>
        </div>

        {/* Environment Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">Use</th>
                <th className="py-2.5 px-3">Variable Key</th>
                <th className="py-2.5 px-3">Configured Value</th>
                <th className="py-2.5 px-3 w-24">Type</th>
                <th className="py-2.5 px-3 w-16 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No environment variables defined yet. Click "Add Variable" below.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) => handleFieldChange(entry.id, 'enabled', e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={entry.key}
                        onChange={(e) => handleFieldChange(entry.id, 'key', e.target.value)}
                        placeholder="e.g. baseUrl or apiKey"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-3">
                      <div className="relative flex items-center">
                        <input
                          type={entry.isSecret && !showValues[entry.id] ? 'password' : 'text'}
                          value={entry.value}
                          onChange={(e) => handleFieldChange(entry.id, 'value', e.target.value)}
                          placeholder="e.g. https://api.example.com"
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-2.5 pr-8 py-1.5 text-xs text-emerald-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                        />
                        {entry.isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleShowValue(entry.id)}
                            className="absolute right-2 text-slate-400 hover:text-slate-200"
                            title={showValues[entry.id] ? 'Hide Secret' : 'Show Secret'}
                          >
                            {showValues[entry.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        entry.isSecret 
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {entry.isSecret ? '🔒 Secret' : 'Default'}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleRemoveRow(entry.id)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-red-950 hover:text-red-400 transition-colors"
                        title="Delete variable"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleAddRow}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add Variable</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Environment</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm whitespace-nowrap"
        title="Configure Environment Variables (Postman Style)"
      >
        <Sliders className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span>Environment Variables</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
};
