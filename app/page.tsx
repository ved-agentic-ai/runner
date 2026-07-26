'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileCode, 
  Upload, 
  FolderPlus, 
  Zap, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  BarChart3, 
  Activity, 
  CheckCircle,
  Clock,
  Play,
  RotateCcw,
  Cloud,
  Laptop,
  AlertTriangle,
  Key,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Search
} from 'lucide-react';
import { Header } from '@/components/Header';
import { ReleasePipelineBar } from '@/components/ReleasePipelineBar';
import { TreeView } from '@/components/TreeView';
import { EndpointDetailSheet } from '@/components/EndpointDetailSheet';
import { RunnerDashboard } from '@/components/RunnerDashboard';
import { LiveTrafficSimulator } from '@/components/LiveTrafficSimulator';
import { CustomUseCasesVault } from '@/components/CustomUseCasesVault';
import { PresentationDeckModal } from '@/components/PresentationDeckModal';
import { UserWorkspaceSidebar } from '@/components/UserWorkspaceSidebar';
import { ServerSaveWarningModal } from '@/components/ServerSaveWarningModal';
import { Footer } from '@/components/Footer';
import { AppDocumentationSection } from '@/components/AppDocumentationSection';
import { PciComplianceBanner } from '@/components/PciComplianceBanner';
import { PrivacyBanner } from '@/components/PrivacyBanner';
import { StepByStepClickGuide } from '@/components/StepByStepClickGuide';
import { MfaPromptModal } from '@/components/MfaPromptModal';
import { CustomDialogModal } from '@/components/CustomDialogModal';

import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { parsePostmanCollection, parsePostmanEnvironment, parseEnvironmentContent, formatPostmanUrl } from '@/lib/postman-parser';
import { parseAndNormalizeServerCollection } from '@/lib/collection-parser';
import { TreeNode, HttpMethod } from '@/lib/types';

export default function Home() {
  const { 
    collectionName, 
    loadCollection, 
    loadDemoCollection, 
    rootNodes, 
    flatEndpointMap,
    envVariables,
    runSelectedEndpoints,
    clearResults
  } = useRunnerStore();

  const { 
    workspaceMode, 
    setWorkspaceMode,
    releaseEnvironment,
    showStepByStepGuide, 
    showCapabilitiesGrid,
    showPlatformOverviewBanner,
    showTrafficSimulator,
    showCustomRulesVault,
    showDocumentation,
    showFooter,
    showPciCompliance,
    showPrivacyBanner,
    mfaForEnvComparison,
    isMfaAuthenticated,
    recordPageView
  } = useAdminStore();

  const { user, isAuthenticated } = useUserAuthStore();

  const [activeMainTab, setActiveMainTab] = useState<'upload' | 'runner' | 'architecture' | 'vault' | 'simulator'>('upload');
  const [fileToSave, setFileToSave] = useState<{ name: string; type: 'collection' | 'env'; content: string } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  // Environment File Comparison Modal state
  const [envCompareModalOpen, setEnvCompareModalOpen] = useState(false);
  const [envCompareFile, setEnvCompareFile] = useState<any | null>(null);
  const [showMfaForCompare, setShowMfaForCompare] = useState(false);
  const [selectedCompareKeys, setSelectedCompareKeys] = useState<Set<string>>(new Set());
  const [editedCompareValues, setEditedCompareValues] = useState<Record<string, string>>({});
  const [expandedCompareRowKey, setExpandedCompareRowKey] = useState<string | null>(null);
  const [compareSearchQuery, setCompareSearchQuery] = useState('');

  // Custom Interactive Dialog State (Replaces all browser alert calls)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info' | 'success';
  }>({ isOpen: false, title: '', message: '', type: 'warning' });

  useEffect(() => {
    if (envCompareFile) {
      let serverEnv: Record<string, string> = {};
      const trimmed = (envCompareFile.content || '').trim();
      if (trimmed.startsWith('{')) {
        try {
          const json = JSON.parse(trimmed);
          if (json.values && Array.isArray(json.values)) {
            json.values.forEach((v: any) => { if (v.key) serverEnv[v.key] = String(v.value || ''); });
          } else {
            serverEnv = json;
          }
        } catch (e) {}
      } else {
        trimmed.split('\n').forEach((l: string) => {
          const eq = l.indexOf('=');
          if (eq !== -1) {
            const k = l.substring(0, eq).trim();
            const v = l.substring(eq + 1).trim();
            if (k) serverEnv[k] = v;
          }
        });
      }
      setSelectedCompareKeys(new Set(Object.keys(serverEnv)));
    }
  }, [envCompareFile]);

  // Sequential Step Flow State in Tab 1
  const [uploadStep, setUploadStep] = useState<'collection' | 'env_optional'>('collection');
  const [envNotification, setEnvNotification] = useState<string | null>(null);

  // Load Confirmation Dialog state
  const [pendingServerFileToLoad, setPendingServerFileToLoad] = useState<any | null>(null);

  const handleLoadServerFile = (fileRecord: any) => {
    setPendingServerFileToLoad(fileRecord);
  };

  const executeLoadServerFile = (overrideMode: 'replace' | 'sidebyside') => {
    if (!pendingServerFileToLoad) return;
    const fileRecord = pendingServerFileToLoad;

    try {
      if (fileRecord.fileType === 'collection') {
        const parsed = JSON.parse(fileRecord.content);
        let { collectionName: loadedName, rootNodes: loadedRoots, flatEndpointMap: loadedMap, allNodeIds: loadedIds } = parseAndNormalizeServerCollection(parsed, fileRecord.fileName);

        // If sidebar selection subset exists (e.g., 6 out of 32 nodes), filter loadedRoots & loadedMap
        if (fileRecord.selectedNodeIds && Array.isArray(fileRecord.selectedNodeIds) && fileRecord.selectedNodeIds.length > 0) {
          const selectedSet = new Set(fileRecord.selectedNodeIds);
          function filterNodes(nodes: TreeNode[]): TreeNode[] {
            const filtered: TreeNode[] = [];
            for (const n of nodes) {
              if (n.type === 'endpoint') {
                if (selectedSet.has(n.id) || selectedSet.has(n.name)) filtered.push({ ...n });
              } else if (n.type === 'folder' && n.children) {
                const sub = filterNodes(n.children);
                if (sub.length > 0) filtered.push({ ...n, children: sub });
              }
            }
            return filtered;
          }
          const filteredRoots = filterNodes(loadedRoots);
          if (filteredRoots.length > 0) {
            loadedRoots = filteredRoots;

            // Rebuild map & ids
            const newMap = new Map<string, TreeNode>();
            const newIds: string[] = [];
            function rebuildMap(nodes: TreeNode[]) {
              nodes.forEach((n) => {
                newIds.push(n.id);
                if (n.type === 'endpoint') newMap.set(n.id, n);
                if (n.children) rebuildMap(n.children);
              });
            }
            rebuildMap(loadedRoots);
            loadedMap = newMap;
            loadedIds = newIds;
          }
        }

        if (overrideMode === 'replace') {
          useRunnerStore.setState({
            collectionName: loadedName,
            rootNodes: loadedRoots,
            serverCollectionName: loadedName,
            serverRootNodes: loadedRoots,
            serverFlatEndpointMap: loadedMap,
            flatEndpointMap: loadedMap,
            selectedNodeIds: loadedIds,
            activeWorkspaceSource: 'server',
            executionResults: {},
            generatedTestSuites: {},
            runSummary: {
              total: loadedMap.size,
              passed: 0,
              failed: 0,
              running: 0,
              pending: loadedMap.size,
              avgLatencyMs: 0,
              minLatencyMs: 0,
              maxLatencyMs: 0,
              status: 'idle'
            }
          });
        } else {
          // Side-by-side mode: populate server workspace and merge maps
          const currentFlatMap = useRunnerStore.getState().flatEndpointMap;
          const mergedMap = new Map([...Array.from(currentFlatMap.entries()), ...Array.from(loadedMap.entries())]);
          const currentSelected = useRunnerStore.getState().selectedNodeIds;
          const mergedSelected = Array.from(new Set([...currentSelected, ...loadedIds]));

          useRunnerStore.setState({
            serverCollectionName: loadedName,
            serverRootNodes: loadedRoots,
            serverFlatEndpointMap: loadedMap,
            flatEndpointMap: mergedMap,
            selectedNodeIds: mergedSelected,
            activeWorkspaceSource: 'server',
            executionResults: {},
            generatedTestSuites: {},
            runSummary: {
              total: mergedMap.size,
              passed: 0,
              failed: 0,
              running: 0,
              pending: mergedMap.size,
              avgLatencyMs: 0,
              minLatencyMs: 0,
              maxLatencyMs: 0,
              status: 'idle'
            }
          });
        }
        setEnvNotification(`✅ Server Collection "${loadedName}" loaded (${loadedMap.size} selected endpoints ready)!`);
        setTimeout(() => setEnvNotification(null), 4000);
        setActiveMainTab('runner');
      } else {
        // Robust Environment file loading (supports both JSON Postman Env and KEY=VAL formats)
        let envObj: Record<string, string> = {};
        const trimmedContent = fileRecord.content.trim();
        
        if (trimmedContent.startsWith('{')) {
          try {
            const json = JSON.parse(trimmedContent);
            if (json.values && Array.isArray(json.values)) {
              json.values.forEach((v: any) => {
                if (v.key) envObj[v.key] = String(v.value || '');
              });
            } else {
              envObj = json;
            }
          } catch (e) {}
        } else {
          const lines = trimmedContent.split('\n');
          lines.forEach((line: string) => {
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
              const k = line.substring(0, eqIdx).trim();
              const v = line.substring(eqIdx + 1).trim();
              if (k) envObj[k] = v;
            }
          });
        }

        if (fileRecord.selectedEnvKeys && Array.isArray(fileRecord.selectedEnvKeys) && fileRecord.selectedEnvKeys.length > 0) {
          const selectedKeySet = new Set(fileRecord.selectedEnvKeys);
          const filteredEnv: Record<string, string> = {};
          Object.entries(envObj).forEach(([k, v]) => {
            if (selectedKeySet.has(k)) {
              filteredEnv[k] = v;
            }
          });
          envObj = filteredEnv;
        }

        if (overrideMode === 'replace') {
          useRunnerStore.setState({ envVariables: envObj });
        } else {
          useRunnerStore.setState({ envVariables: { ...useRunnerStore.getState().envVariables, ...envObj } });
        }

        setEnvNotification(`✅ Server Environment file "${fileRecord.fileName}" loaded (${Object.keys(envObj).length} keys active in workspace memory)!`);
        setTimeout(() => setEnvNotification(null), 4500);
        setActiveMainTab('runner');
      }
    } catch (err: any) {
      console.error('Error loading server file into workspace:', err);
      setDialogState({
        isOpen: true,
        title: '⚠️ Could Not Load Server File',
        message: `Could not parse server file: ${err.message}`,
        type: 'error'
      });
    }

    setPendingServerFileToLoad(null);
  };

  useEffect(() => {
    recordPageView();
  }, [recordPageView]);

  // Step 1 Collection or Environment Upload Handler
  const handleCollectionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;

        // Auto-detect if file is an Environment file (.env or Postman Environment JSON)
        const { envMap, isEnvFile } = parseEnvironmentContent(content);
        if (isEnvFile || file.name.endsWith('.env')) {
          useRunnerStore.setState({ envVariables: { ...useRunnerStore.getState().envVariables, ...envMap } });
          setEnvNotification(`💡 Environment file "${file.name}" detected & attached to workspace (${Object.keys(envMap).length} variables configured)!`);
          setTimeout(() => setEnvNotification(null), 4500);
          setUploadStep('env_optional');
          e.target.value = '';
          return;
        }

        const parsed = JSON.parse(content);
        if (parsed.info || parsed.item || parsed.nodes || Array.isArray(parsed)) {
          loadCollection(parsed);
          setUploadStep('env_optional');
        } else {
          setDialogState({
            isOpen: true,
            title: '⚠️ Unrecognized Collection Schema',
            message: 'The uploaded file does not match a valid Postman Collection JSON schema (missing "info" or "item" nodes). If this is an environment file, please attach it as an environment file.',
            type: 'warning'
          });
        }
      } catch (err) {
        setDialogState({
          isOpen: true,
          title: '⚠️ File Parse Error',
          message: 'Could not parse collection file. Please ensure it is a valid Postman Collection JSON or .env file.',
          type: 'error'
        });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleTriggerLoadDemo = () => {
    loadDemoCollection();
    setUploadStep('env_optional');
  };

  // Step 2 Environment Upload Handler -> Moves directly to Tab 2 (Runner)
  const handleEnvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { envMap, isEnvFile } = parseEnvironmentContent(content);

        if (isEnvFile || Object.keys(envMap).length > 0) {
          useRunnerStore.setState({ envVariables: { ...useRunnerStore.getState().envVariables, ...envMap } });
          setEnvNotification(`✅ Attached ${Object.keys(envMap).length} environment variables to active workspace!`);
          setTimeout(() => setEnvNotification(null), 4000);
          setActiveMainTab('runner');
        } else {
          setDialogState({
            isOpen: true,
            title: '⚠️ Invalid Environment File',
            message: 'The uploaded file does not contain valid KEY=VALUE pairs or Postman Environment JSON.',
            type: 'warning'
          });
        }
      } catch (err) {
        setDialogState({
          isOpen: true,
          title: '⚠️ Environment File Error',
          message: 'Invalid environment file format. Please upload a valid Postman Environment JSON or .env file.',
          type: 'error'
        });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleSaveWorkspaceTrigger = () => {
    const currentStore = useRunnerStore.getState();
    const activeNodesToSave = currentStore.rootNodes.length > 0 ? currentStore.rootNodes : currentStore.serverRootNodes;

    if (activeNodesToSave.length === 0) {
      setDialogState({
        isOpen: true,
        title: '⚠️ Workspace Is Empty',
        message: 'Workspace is currently empty. Please load or upload a Postman collection first.',
        type: 'warning'
      });
      return;
    }

    const exportPayload = {
      name: currentStore.collectionName || currentStore.serverCollectionName || 'Saved Collection',
      nodes: activeNodesToSave,
      savedAt: new Date().toISOString()
    };

    setFileToSave({
      name: `${(currentStore.collectionName || currentStore.serverCollectionName || 'workspace').toLowerCase().replace(/\s+/g, '-')}.json`,
      type: 'collection',
      content: JSON.stringify(exportPayload, null, 2)
    });
    setSaveModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Application Navigation Header */}
      <Header />

      {/* 3-Stage Release Pipeline Environment Bar (DEV, PREVIEW, LIVE) */}
      <ReleasePipelineBar />

      {/* Environment Variable Upload Notification Toast */}
      {envNotification && (
        <div className="fixed top-20 right-6 z-[99999] flex items-center space-x-2 rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-4 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{envNotification}</span>
        </div>
      )}

      {/* MAIN APPLICATION CONTAINER */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* RELEASE ENVIRONMENT STATUS BANNER */}
        {releaseEnvironment === 'dev' && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">🛠️</span>
              <div>
                <h4 className="font-extrabold text-amber-200 text-xs flex items-center gap-2">
                  1. DEVELOPMENT SANDBOX MODE (DEV)
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">Isolated Sandbox</span>
                </h4>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  All active edits, test runs, and custom assertions are in development mode. Stable production version is protected from ongoing changes.
                </p>
              </div>
            </div>
            <button
              onClick={() => useAdminStore.getState().promoteEnvironment('preview')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md whitespace-nowrap self-start sm:self-auto transition-all"
            >
              🚀 Push to Preview Staging
            </button>
          </div>
        )}

        {releaseEnvironment === 'preview' && (
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">👁️</span>
              <div>
                <h4 className="font-extrabold text-purple-200 text-xs flex items-center gap-2">
                  2. PREVIEW STAGING MODE (PREVIEW)
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">Pre-Live Verification</span>
                </h4>
                <p className="text-[11px] text-purple-300/80 mt-0.5">
                  Pre-live verification view. Test endpoints, review UI telemetry, and inspect changes before promoting to Live production.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => useAdminStore.getState().rollbackEnvironment('dev')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800"
              >
                🔙 Return to DEV
              </button>
              <button
                onClick={() => useAdminStore.getState().promoteEnvironment('live')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md whitespace-nowrap transition-all"
              >
                ✅ Promote to Live Production
              </button>
            </div>
          </div>
        )}

        {releaseEnvironment === 'live' && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md animate-in fade-in">
            <div className="flex items-center space-x-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">🌟</span>
              <div>
                <h4 className="font-extrabold text-emerald-200 text-xs flex items-center gap-2">
                  3. LIVE PRODUCTION MODE (LIVE)
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">Stable Production</span>
                </h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Official stable release view active for end-users. All workspace changes were verified in Preview before release.
                </p>
              </div>
            </div>
            <button
              onClick={() => useAdminStore.getState().setReleaseEnvironment('dev')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs whitespace-nowrap self-start sm:self-auto transition-all"
            >
              🛠️ Open Sandbox in DEV Mode
            </button>
          </div>
        )}

        {/* 100% LOCAL PRIVACY BANNER AT TOP OF PAGE */}
        {showPrivacyBanner && (
          <PrivacyBanner />
        )}
        
        {/* STEP BY STEP WHERE TO CLICK GUIDE */}
        {showStepByStepGuide && (
          <StepByStepClickGuide onNavigateTab={(t) => setActiveMainTab(t)} />
        )}

        {/* TOP LEVEL NAVIGATION WORKSPACE TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMainTab('upload')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span>1. Upload & Collection Presets</span>
            </button>

            <button
              onClick={() => setActiveMainTab('runner')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === 'runner'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Zap className="h-4 w-4 shrink-0" />
              <span>🚀 2. Runner & Live Telemetry</span>
              {flatEndpointMap.size > 0 && (
                <span className="ml-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/30 font-mono">
                  {flatEndpointMap.size}
                </span>
              )}
            </button>

            {workspaceMode === 'full' && (
              <>
                <button
                  onClick={() => setActiveMainTab('simulator')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMainTab === 'simulator'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Activity className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>⚡ 3. Live Traffic & Routing Simulator</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('vault')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMainTab === 'vault'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>🛡️ 4. Custom & AI Test Use Cases Vault</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('architecture')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeMainTab === 'architecture'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Cloud className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>☁️ 5. AWS System Architecture</span>
                </button>
              </>
            )}
          </div>

          <span className="hidden xl:inline-flex items-center text-[11px] text-slate-400 font-mono px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
            Active Workspace: <strong className="text-indigo-300 ml-1 truncate max-w-[220px]">{collectionName || 'Demo Suite'}</strong>
          </span>
        </div>

        {/* WORKSPACE FLEX CONTAINER: LEFT SIDEBAR + TAB CONTENTS */}
        <div className="flex flex-col lg:flex-row items-start gap-6 pt-2 w-full max-w-full overflow-x-hidden">
          
          {/* Left Server Workspace Explorer Sidebar for Logged-In Users */}
          {isAuthenticated && (
            <UserWorkspaceSidebar
              onLoadFileToWorkspace={handleLoadServerFile}
              refreshTrigger={sidebarRefresh}
            />
          )}

          {/* MAIN TAB CONTENT CONTAINER */}
          <div className="flex-1 w-full space-y-6">

            {/* MAIN TAB 1: SEQUENTIAL UPLOAD FLOW (STEP 1 COLLECTION -> STEP 2 OPTIONAL ENV) */}
            {activeMainTab === 'upload' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* STEP 1: COLLECTION UPLOAD CARD */}
                {uploadStep === 'collection' ? (
                  <div className="relative rounded-3xl border-2 border-dashed border-indigo-500/40 bg-gradient-to-br from-indigo-950/30 via-slate-950 to-slate-950 p-8 sm:p-12 text-center transition-all hover:border-indigo-500/80 shadow-2xl space-y-4">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleCollectionUpload}
                      className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer"
                    />
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 mb-2 shadow-lg">
                      <FileCode className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-bold text-white">📂 Step 1: Upload Postman Collection (.json)</h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      Upload or drag-and-drop your Postman Collection JSON file (v2.0 / v2.1). After parsing, you will have the option to attach an environment file.
                    </p>

                    <div className="pt-4 flex flex-wrap justify-center gap-3 z-20">
                      <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all pointer-events-none">
                        Select Collection JSON
                      </button>
                      <button
                        type="button"
                        onClick={handleTriggerLoadDemo}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-slate-800 transition-all pointer-events-auto"
                      >
                        ⚡ Load Demo Suite (138 Endpoints)
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: OPTIONAL ENVIRONMENT UPLOAD CARD */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Collection Upload Success Banner */}
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            Collection Loaded into Memory
                          </h3>
                          <p className="text-xs text-slate-300">
                            Active Suite: <strong className="text-emerald-300 font-mono">{collectionName}</strong> ({flatEndpointMap.size || 138} endpoints parsed)
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setUploadStep('collection')}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                      >
                        Change Collection
                      </button>
                    </div>

                    {/* Step 2 Optional Env Card */}
                    <div className="relative rounded-3xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950 p-8 sm:p-10 text-center transition-all hover:border-amber-500/80 shadow-2xl space-y-4">
                      <input
                        type="file"
                        accept=".json,.env"
                        onChange={handleEnvUpload}
                        className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer"
                      />
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-1 shadow-lg">
                        <Key className="h-7 w-7" />
                      </div>
                      <h2 className="text-base font-bold text-white">🔑 Step 2: Upload Environment Variables (Optional)</h2>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        Attach a Postman Environment JSON or raw `.env` file to resolve template variables (`{"{{baseUrl}}"}`). Or skip this step to execute with default parameters.
                      </p>

                      <div className="pt-4 flex flex-wrap justify-center gap-3 z-20">
                        <button className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all pointer-events-none">
                          Upload Environment File (.json / .env)
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setActiveMainTab('runner')}
                          className="rounded-xl border border-indigo-500/50 bg-indigo-950 px-5 py-2.5 text-xs font-extrabold text-indigo-200 hover:bg-indigo-900 transition-all pointer-events-auto flex items-center gap-2 shadow-lg"
                        >
                          <span>⏭️ Skip & Proceed to Runner</span>
                          <ArrowRight className="h-4 w-4 text-indigo-400" />
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Capabilities Grid */}
                {showCapabilitiesGrid && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 backdrop-blur-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">High Performance Execution</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Execute hundreds of API requests in parallel with live SLA latency tracking, status validation, and automated retries.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 backdrop-blur-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">AI Test Assertion Suite</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Automatically analyze request parameters and response schemas to generate custom test assertion suites in real-time.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2 backdrop-blur-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Cloud Workspace Storage</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Save API collections and environment files to your server account with smart secret redaction (`[REDACTED_SECRET]`).
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* MAIN TAB 2: RUNNER & LIVE TELEMETRY WORKSPACE */}
            {activeMainTab === 'runner' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Hierarchical Tree View Selector (4 cols) */}
                  <div className="lg:col-span-4 h-[780px]">
                    <TreeView />
                  </div>

                  {/* Right Column: Execution Engine & Telemetry Dashboard (8 cols) */}
                  <div className="lg:col-span-8 space-y-5">
                    <RunnerDashboard onSaveToServer={handleSaveWorkspaceTrigger} />
                    {workspaceMode === 'full' && showTrafficSimulator && <LiveTrafficSimulator />}
                  </div>

                </div>
              </div>
            )}

            {/* MAIN TAB 3: LIVE TRAFFIC SIMULATOR */}
            {activeMainTab === 'simulator' && workspaceMode === 'full' && (
              <LiveTrafficSimulator />
            )}

            {/* MAIN TAB 4: CUSTOM RULES VAULT */}
            {activeMainTab === 'vault' && workspaceMode === 'full' && (
              <CustomUseCasesVault />
            )}

            {/* MAIN TAB 5: AWS ENTERPRISE SYSTEM ARCHITECTURE */}
            {activeMainTab === 'architecture' && workspaceMode === 'full' && (
              <AppDocumentationSection initialTab="aws_architecture" />
            )}

          </div>
        </div>

      </main>

      {/* FULL WIDTH PCI COMPLIANCE BANNER */}
      {showPciCompliance && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
          <PciComplianceBanner />
        </div>
      )}

      {/* GLOBAL APPLICATION FOOTER */}
      {(workspaceMode === 'full' || showFooter) && <Footer />}

      {/* SERVER FILE SAVE WARNING MODAL */}
      {fileToSave && (
        <ServerSaveWarningModal
          isOpen={saveModalOpen || !!fileToSave}
          onClose={() => { setSaveModalOpen(false); setFileToSave(null); }}
          fileName={fileToSave.name}
          fileType={fileToSave.type}
          rawContent={fileToSave.content}
          userId={user?.id || 'anonymous'}
          onSuccess={() => setSidebarRefresh((prev) => prev + 1)}
        />
      )}

      {/* LOAD SERVER FILE OVERRIDE CONFIRMATION MODAL (PORTAL) */}
      {pendingServerFileToLoad && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            {pendingServerFileToLoad.fileType === 'env' || pendingServerFileToLoad.fileName?.endsWith('.env') ? (
              <>
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Load Server Environment File</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{pendingServerFileToLoad.fileName}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  How would you like to load server environment file <code className="text-amber-300 font-bold">{pendingServerFileToLoad.fileName}</code> into your active workspace environment variables?
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => executeLoadServerFile('replace')}
                    className="w-full flex items-center space-x-2.5 rounded-xl bg-indigo-600 p-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all text-left"
                  >
                    <RotateCcw className="h-4 w-4 text-indigo-200 shrink-0" />
                    <div>
                      <span className="block font-bold">🔄 Replace & Override All Active Variables</span>
                      <span className="text-[10px] text-indigo-200/70 font-normal">Clears existing workspace variables and loads all keys from file</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (mfaForEnvComparison && !isMfaAuthenticated) {
                        setShowMfaForCompare(true);
                      } else {
                        setEnvCompareFile(pendingServerFileToLoad);
                        setEnvCompareModalOpen(true);
                        setPendingServerFileToLoad(null);
                      }
                    }}
                    className="w-full flex items-center space-x-2.5 rounded-xl border border-amber-700 bg-amber-950/60 p-3 text-xs font-bold text-amber-200 hover:bg-amber-900 transition-all text-left"
                  >
                    <Key className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="block font-bold">🔍 Compare & Merge Keys with Active Workspace</span>
                      <span className="text-[10px] text-amber-300/70 font-normal">Side-by-side comparison with MFA verification & pick-and-choose control</span>
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Load Server Collection</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{pendingServerFileToLoad.fileName}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  How would you like to load server file <code className="text-amber-300 font-bold">{pendingServerFileToLoad.fileName}</code> into your workspace?
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => executeLoadServerFile('replace')}
                    className="w-full flex items-center space-x-2 rounded-xl bg-indigo-600 p-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                  >
                    <RotateCcw className="h-4 w-4 text-indigo-200" />
                    <span>🔄 Replace & Override Active Workspace</span>
                  </button>

                  <button
                    onClick={() => executeLoadServerFile('sidebyside')}
                    className="w-full flex items-center space-x-2 rounded-xl border border-amber-700 bg-amber-950/60 p-3 text-xs font-bold text-amber-200 hover:bg-amber-900 transition-all"
                  >
                    <Cloud className="h-4 w-4 text-amber-400" />
                    <span>☁️ Load Side-by-Side (Keep Dual Local & Server Tabs)</span>
                  </button>
                </div>
              </>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setPendingServerFileToLoad(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MFA PROMPT MODAL FOR ENVIRONMENT COMPARISON */}
      <MfaPromptModal
        isOpen={showMfaForCompare}
        sectionTitle="Environment Secrets Comparison"
        onClose={() => setShowMfaForCompare(false)}
        onSuccess={() => {
          setShowMfaForCompare(false);
          useAdminStore.setState({ isMfaAuthenticated: true });
          if (pendingServerFileToLoad) {
            setEnvCompareFile(pendingServerFileToLoad);
            setEnvCompareModalOpen(true);
            setPendingServerFileToLoad(null);
          }
        }}
      />

      {/* INTERACTIVE ENVIRONMENT COMPARISON & MERGE MODAL PORTAL */}
      {envCompareModalOpen && envCompareFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Compare & Merge Environment Variables</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[300px]">{envCompareFile.fileName}</p>
                </div>
              </div>
              <button 
                onClick={() => { setEnvCompareModalOpen(false); setEnvCompareFile(null); }}
                className="text-slate-400 hover:text-white p-1 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Review and select which keys from server file <code className="text-amber-300 font-bold">{envCompareFile.fileName}</code> to merge into your active workspace. Key conflicts are highlighted for inspection.
            </p>

            {/* Comparison Table */}
            {(() => {
              const activeEnv = useRunnerStore.getState().envVariables;
              let serverEnv: Record<string, string> = {};
              const trimmed = (envCompareFile.content || '').trim();
              if (trimmed.startsWith('{')) {
                try {
                  const json = JSON.parse(trimmed);
                  if (json.values && Array.isArray(json.values)) {
                    json.values.forEach((v: any) => { if (v.key) serverEnv[v.key] = String(v.value || ''); });
                  } else {
                    serverEnv = json;
                  }
                } catch (e) {}
              } else {
                trimmed.split('\n').forEach((l: string) => {
                  const eq = l.indexOf('=');
                  if (eq !== -1) {
                    const k = l.substring(0, eq).trim();
                    const v = l.substring(eq + 1).trim();
                    if (k) serverEnv[k] = v;
                  }
                });
              }

              const allKeys = Array.from(new Set([...Object.keys(serverEnv), ...Object.keys(activeEnv)]));
              const filteredKeys = allKeys.filter((key) => {
                if (!compareSearchQuery.trim()) return true;
                const q = compareSearchQuery.toLowerCase();
                const sVal = (serverEnv[key] || '').toLowerCase();
                const aVal = (activeEnv[key] || '').toLowerCase();
                return key.toLowerCase().includes(q) || sVal.includes(q) || aVal.includes(q);
              });

              return (
                <div className="space-y-3">
                  {/* Compare Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search keys or values to compare..."
                      value={compareSearchQuery}
                      onChange={(e) => setCompareSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                    />
                    {compareSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCompareSearchQuery('')}
                        className="absolute right-3 top-2 text-[11px] font-bold text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="relative max-h-72 overflow-y-auto overflow-x-auto custom-scrollbar rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead className="sticky top-0 z-20 bg-[#0f172a] text-slate-300 text-[10px] uppercase border-b border-slate-700 shadow-md">
                        <tr>
                          <th className="p-3 w-10 text-center bg-[#0f172a]">Merge</th>
                          <th className="p-3 w-44 min-w-[160px] bg-[#0f172a]">Variable Key</th>
                          <th className="p-3 w-56 min-w-[180px] bg-[#0f172a]">Server File Value</th>
                          <th className="p-3 w-56 min-w-[180px] bg-[#0f172a]">Active Workspace Value</th>
                          <th className="p-3 w-28 text-right bg-[#0f172a]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredKeys.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                              No keys match "{compareSearchQuery}".
                            </td>
                          </tr>
                        ) : (
                          filteredKeys.map((key) => {
                            const serverVal = serverEnv[key];
                            const activeVal = activeEnv[key];
                            const hasServer = serverVal !== undefined;
                            const hasActive = activeVal !== undefined;
                            const isConflict = hasServer && hasActive && serverVal !== activeVal;
                            const isMatch = hasServer && hasActive && serverVal === activeVal;
                            const isNew = hasServer && !hasActive;
                            const isChecked = selectedCompareKeys.has(key);
                            const isExpanded = expandedCompareRowKey === key;
                            const currentEditVal = editedCompareValues[key] !== undefined ? editedCompareValues[key] : (serverVal || '');

                            return (
                              <React.Fragment key={key}>
                                <tr 
                                  onClick={() => setExpandedCompareRowKey(isExpanded ? null : key)}
                                  className={`hover:bg-slate-900/80 cursor-pointer transition-all ${isConflict ? 'bg-amber-950/20' : ''}`}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = new Set(selectedCompareKeys);
                                        if (next.has(key)) next.delete(key);
                                        else next.add(key);
                                        setSelectedCompareKeys(next);
                                      }}
                                      className="text-amber-400 hover:text-white"
                                    >
                                      {isChecked ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4 text-slate-600" />}
                                    </button>
                                  </td>
                                  <td className="p-3 font-bold text-slate-200 break-all min-w-[160px]">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] text-slate-500">{isExpanded ? '▼' : '▶'}</span>
                                      <span>{key}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-emerald-300 break-all min-w-[180px]">
                                    {serverVal !== undefined ? serverVal : <span className="text-slate-600 italic">None</span>}
                                  </td>
                                  <td className="p-3 font-mono text-indigo-300 break-all min-w-[180px]">
                                    {activeVal !== undefined ? activeVal : <span className="text-slate-600 italic">None</span>}
                                  </td>
                                  <td className="p-3 text-right">
                                    {isConflict ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                        ⚠️ Conflict
                                      </span>
                                    ) : isMatch ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                        Match
                                      </span>
                                    ) : isNew ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                        + New
                                      </span>
                                    ) : null}
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-950 border-t border-b border-amber-500/30">
                                    <td colSpan={5} className="p-4 space-y-3">
                                      <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                                        <span>🔍 Inspected Variable: <code className="text-white">{key}</code></span>
                                        <span className="text-[10px] text-slate-400">Full Un-truncated Inspector</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div className="space-y-1">
                                          <label className="block text-[10px] uppercase font-bold text-emerald-400">Server File Value (Editable):</label>
                                          <input
                                            type="text"
                                            value={currentEditVal}
                                            onChange={(e) => setEditedCompareValues({ ...editedCompareValues, [key]: e.target.value })}
                                            className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 font-mono text-emerald-300 text-xs focus:border-emerald-500 focus:outline-none"
                                            placeholder="Enter server value..."
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="block text-[10px] uppercase font-bold text-indigo-400">Active Workspace Value:</label>
                                          <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 font-mono text-indigo-300 text-xs break-all select-all">
                                            {activeVal !== undefined ? activeVal : <span className="text-slate-600 italic">Not set in active workspace</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </React.Fragment>
                          );
                        })
                      )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <span>{selectedCompareKeys.size} keys selected for merge</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setEnvCompareModalOpen(false); setEnvCompareFile(null); }}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const newEnv = { ...activeEnv };
                          selectedCompareKeys.forEach((key) => {
                            if (serverEnv[key] !== undefined) {
                              newEnv[key] = editedCompareValues[key] !== undefined ? editedCompareValues[key] : serverEnv[key];
                            }
                          });
                          useRunnerStore.setState({ envVariables: newEnv });
                          setEnvCompareModalOpen(false);
                          setEnvCompareFile(null);
                          setEnvNotification(`✅ Merged ${selectedCompareKeys.size} environment variables into active workspace!`);
                          setTimeout(() => setEnvNotification(null), 4500);
                          setActiveMainTab('runner');
                        }}
                        disabled={selectedCompareKeys.size === 0}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all disabled:opacity-40"
                      >
                        ✅ Confirm & Merge Selected Variables
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* REUSABLE CUSTOM DIALOG MODAL (REPLACES BROWSER ALERT) */}
      <CustomDialogModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
      />

    </div>
  );
}
