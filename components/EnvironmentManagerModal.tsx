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
  ShieldAlert,
  Upload,
  Search
} from 'lucide-react';
import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { parseEnvironmentContent } from '@/lib/postman-parser';
import { MfaPromptModal } from './MfaPromptModal';
import { CustomDialogModal } from './CustomDialogModal';

interface EnvVarEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret: boolean;
}

export const EnvironmentManagerModal: React.FC = () => {
  const { envVariables } = useRunnerStore();
  const { mfaEnabled, isMfaAuthenticated, protectedSections } = useAdminStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<EnvVarEntry[]>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [validationDialog, setValidationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

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

  const handleOpenClick = () => {
    if (mfaEnabled && protectedSections.environment && !isMfaAuthenticated) {
      setShowMfaModal(true);
      return;
    }
    setIsOpen(true);
  };

  const handleMfaSuccess = () => {
    setShowMfaModal(false);
    setIsOpen(true);
  };

  const handleAddRow = () => {
    setEntries(prev => [
      ...prev,
      {
        id: `env-${Date.now()}-${prev.length}`,
        key: '',
        value: '',
        enabled: true,
        isSecret: false
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setEntries((prev) => prev.filter(e => e.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof EnvVarEntry, val: any) => {
    setEntries((prev) => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: val };
        if (field === 'key' && typeof val === 'string') {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const { envMap, isEnvFile } = parseEnvironmentContent(content);

      if (!isEnvFile && Object.keys(envMap).length === 0) {
        setValidationDialog({
          isOpen: true,
          title: '⚠️ Invalid Environment File',
          message: `The file "${file.name}" does not match an Environment file schema. If this is a Postman Collection JSON, please upload it via the main dashboard Step 1.`
        });
        e.target.value = '';
        return;
      }

      const newEntries: EnvVarEntry[] = Object.entries(envMap).map(([k, v], idx) => ({
        id: `upload-${Date.now()}-${idx}-${k}`,
        key: k,
        value: v,
        enabled: true,
        isSecret: /key|secret|token|password|auth|jwt|bearer|private|credential|pwd|cert|salt/i.test(k)
      }));

      if (newEntries.length > 0) {
        setEntries((prev) => {
          const filteredPrev = prev.filter(
            (e) => !(e.key === 'baseUrl' && e.value === 'https://jsonplaceholder.typicode.com')
          );
          const existingMap = new Map(filteredPrev.map((e) => [e.key, e]));
          newEntries.forEach((ne) => {
            existingMap.set(ne.key, ne);
          });
          return Array.from(existingMap.values());
        });
      }

      e.target.value = '';
    };

    reader.readAsText(file);
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
              <h2 className="text-base font-bold text-white flex flex-wrap items-center gap-2">
                <span>Environment Variables Manager</span>
                {searchFilter ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold animate-in fade-in">
                    Showing {entries.filter((e) => e.key.toLowerCase().includes(searchFilter.toLowerCase()) || e.value.toLowerCase().includes(searchFilter.toLowerCase())).length} / {entries.length} Matching Variables
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-mono font-bold">
                    {entries.length} Variables ({entries.filter((e) => e.isSecret).length} Redacted Secrets, {entries.filter((e) => !e.isSecret).length} Config)
                  </span>
                )}
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

        {/* Environment Variable Search Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search environment keys or values..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-2 text-[11px] font-bold text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Environment Table Container */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 max-h-[360px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">Use</th>
                <th className="py-2.5 px-3">Variable Key</th>
                <th className="py-2.5 px-3">Configured Value</th>
                <th className="py-2.5 px-3 w-36">Redaction & Type</th>
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
              ) : entries.filter((e) => !searchFilter.trim() || e.key.toLowerCase().includes(searchFilter.toLowerCase()) || e.value.toLowerCase().includes(searchFilter.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No environment variables match "{searchFilter}".
                  </td>
                </tr>
              ) : (
                entries
                  .filter((e) => !searchFilter.trim() || e.key.toLowerCase().includes(searchFilter.toLowerCase()) || e.value.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((entry) => (
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
                      <button
                        type="button"
                        onClick={() => handleFieldChange(entry.id, 'isSecret', !entry.isSecret)}
                        className={`inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all border cursor-pointer ${
                          entry.isSecret 
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        title="Click to toggle between Redacted Secret vs Public Config"
                      >
                        {entry.isSecret ? <Lock className="h-3 w-3 text-amber-400 shrink-0" /> : <Eye className="h-3 w-3 text-slate-400 shrink-0" />}
                        <span>{entry.isSecret ? '🔒 Secret / Redacted' : '👁️ Public Config'}</span>
                      </button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              <span>Add Variable</span>
            </button>

            <label className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-800/80 bg-indigo-950/60 px-3.5 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-900/80 hover:text-white transition-all cursor-pointer shadow-sm">
              <Upload className="h-3.5 w-3.5 text-indigo-400" />
              <span>Upload .env / JSON File</span>
              <input
                type="file"
                accept=".env,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={entries.length === 0}
              className="inline-flex items-center space-x-1.5 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-900/50 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset All Variables</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setIsOpen(false); setShowResetConfirm(false); }}
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

        {/* RESET CONFIRMATION PROMPT BANNER */}
        {showResetConfirm && (
          <div className="rounded-2xl border border-red-900/80 bg-red-950/60 p-3.5 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <span className="font-bold text-red-200">
              ⚠️ Are you sure you want to delete and reset all {entries.length} environment variables?
            </span>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 font-bold text-[11px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  useRunnerStore.setState({ envVariables: {} });
                  setEntries([]);
                  setShowResetConfirm(false);
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] shadow-md transition-all"
              >
                🗑️ Yes, Delete All
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* Inline MFA Prompt Modal */}
      <MfaPromptModal
        isOpen={showMfaModal}
        sectionTitle="Environment Variables Manager"
        onClose={() => setShowMfaModal(false)}
        onSuccess={handleMfaSuccess}
      />

      {/* Trigger Button */}
      <button
        onClick={handleOpenClick}
        className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all shadow-sm whitespace-nowrap"
        title="Configure Environment Variables (Postman Style)"
      >
        <Sliders className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span>Environment Variables</span>
        {mfaEnabled && protectedSections.environment && !isMfaAuthenticated && (
          <ShieldAlert className="h-3 w-3 text-amber-400 ml-0.5" />
        )}
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}

      {/* Validation Error Dialog Modal */}
      <CustomDialogModal
        isOpen={validationDialog.isOpen}
        title={validationDialog.title}
        message={validationDialog.message}
        type="warning"
        onClose={() => setValidationDialog({ ...validationDialog, isOpen: false })}
      />
    </>
  );
};
