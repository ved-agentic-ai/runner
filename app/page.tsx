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
  CheckCircle2
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

import { useRunnerStore } from '@/lib/store';
import { useAdminStore } from '@/lib/admin-store';
import { useUserAuthStore } from '@/lib/user-auth-store';
import { parsePostmanCollection, parsePostmanEnvironment, formatPostmanUrl } from '@/lib/postman-parser';
import { TreeNode, HttpMethod } from '@/lib/types';

// Helper function to normalize any collection format (Postman v2 JSON or saved Node Tree) into valid TreeNodes
function parseAndNormalizeServerCollection(parsed: any, fileName: string): {
  collectionName: string;
  rootNodes: TreeNode[];
  flatEndpointMap: Map<string, TreeNode>;
  allNodeIds: string[];
} {
  const flatEndpointMap = new Map<string, TreeNode>();
  const allNodeIds: string[] = [];

  // Case 1: Postman collection schema with .info or .item
  if (parsed.info || parsed.item) {
    const { rootNodes, flatEndpointMap: parsedMap } = parsePostmanCollection(parsed);
    function collectIds(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        allNodeIds.push(n.id);
        if (n.children) collectIds(n.children);
      });
    }
    collectIds(rootNodes);
    return {
      collectionName: parsed.name || parsed.info?.name || fileName,
      rootNodes,
      flatEndpointMap: parsedMap,
      allNodeIds
    };
  }

  // Case 2: Custom node tree array or object with .nodes
  const rawNodes = Array.isArray(parsed) ? parsed : (parsed.nodes || []);

  function normalizeNodes(nodes: any[], parentId: string | null = null, pathPrefix: string = ''): TreeNode[] {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((item, idx) => {
      const isFolder = item.type === 'folder' || Array.isArray(item.children) || Array.isArray(item.item);
      const uniqueSuffix = item.name ? item.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) : idx;
      const nodeId = `${parentId ? parentId + '-' : 'node-'}${idx + 1}-${uniqueSuffix}-${isFolder ? 'folder' : 'endpoint'}`;
      const currentPath = pathPrefix ? `${pathPrefix} / ${item.name}` : (item.name || 'Unnamed');

      allNodeIds.push(nodeId);

      if (isFolder) {
        const rawChildren = item.children || item.item || [];
        const children = normalizeNodes(rawChildren, nodeId, currentPath);
        return {
          id: nodeId,
          name: item.name || 'Folder',
          type: 'folder',
          description: item.description,
          children,
          parentId,
          path: currentPath,
        };
      } else {
        const method = (item.method?.toUpperCase() as HttpMethod) || 'GET';
        const url = item.url || (item.request ? formatPostmanUrl(item.request.url) : '');
        const node: TreeNode = {
          id: nodeId,
          name: item.name || 'Endpoint',
          type: 'endpoint',
          method,
          url,
          description: item.description,
          request: item.request,
          parentId,
          path: currentPath,
        };
        flatEndpointMap.set(nodeId, node);
        return node;
      }
    });
  }

  const rootNodes = normalizeNodes(rawNodes);

  return {
    collectionName: parsed.name || fileName,
    rootNodes,
    flatEndpointMap,
    allNodeIds
  };
}

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
    releaseEnvironment,
    showStepByStepGuide, 
    showCapabilitiesGrid,
    showTrafficSimulator,
    showCustomRulesVault,
    showDocumentation,
    recordPageView
  } = useAdminStore();

  const { user, isAuthenticated } = useUserAuthStore();

  const [activeMainTab, setActiveMainTab] = useState<'upload' | 'runner' | 'architecture' | 'vault'>('upload');
  const [fileToSave, setFileToSave] = useState<{ name: string; type: 'collection' | 'env'; content: string } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

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
                if (selectedSet.has(n.id)) filtered.push({ ...n });
              } else if (n.type === 'folder' && n.children) {
                const sub = filterNodes(n.children);
                if (sub.length > 0) filtered.push({ ...n, children: sub });
              }
            }
            return filtered;
          }
          loadedRoots = filterNodes(loadedRoots);

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

        if (overrideMode === 'replace') {
          useRunnerStore.setState({
            collectionName: loadedName,
            rootNodes: loadedRoots,
            flatEndpointMap: loadedMap,
            selectedNodeIds: loadedIds,
            activeWorkspaceSource: 'local',
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
        setEnvNotification(`✅ Server Collection "${loadedName}" loaded (${loadedMap.size} endpoints ready)!`);
        setTimeout(() => setEnvNotification(null), 4000);
        setActiveMainTab('runner');
      } else {
        // Environment file loading
        const lines = fileRecord.content.split('\n');
        const envObj: Record<string, string> = {};
        lines.forEach((line: string) => {
          const eqIdx = line.indexOf('=');
          if (eqIdx !== -1) {
            const k = line.substring(0, eqIdx).trim();
            const v = line.substring(eqIdx + 1).trim();
            if (k) envObj[k] = v;
          }
        });
        useRunnerStore.setState({ envVariables: { ...useRunnerStore.getState().envVariables, ...envObj } });
        setEnvNotification(`✅ Environment file "${fileRecord.fileName}" loaded into workspace!`);
        setTimeout(() => setEnvNotification(null), 4000);
        setActiveMainTab('runner');
      }
    } catch (err: any) {
      console.error('Error loading server file into workspace:', err);
      alert(`Could not parse server file: ${err.message}`);
    }

    setPendingServerFileToLoad(null);
  };

  useEffect(() => {
    recordPageView();
  }, [recordPageView]);

  // Step 1 Collection Upload Handler -> Moves to Step 2 (Optional Environment Upload)
  const handleCollectionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.info || parsed.item || parsed.nodes || Array.isArray(parsed)) {
          loadCollection(parsed);
          setUploadStep('env_optional');
        } else {
          alert('Invalid Postman Collection JSON format.');
        }
      } catch (err) {
        alert('Could not parse collection file. Please ensure it is valid JSON.');
      }
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
        let envObj: Record<string, string> = {};

        if (file.name.endsWith('.env')) {
          const lines = content.split('\n');
          lines.forEach((line) => {
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
              const k = line.substring(0, eqIdx).trim();
              const v = line.substring(eqIdx + 1).trim();
              if (k) envObj[k] = v;
            }
          });
        } else {
          const parsed = JSON.parse(content);
          envObj = parsePostmanEnvironment(parsed);
        }

        useRunnerStore.setState({ envVariables: { ...envVariables, ...envObj } });
        setEnvNotification(`✅ Attached ${Object.keys(envObj).length} environment variables to workspace!`);
        setTimeout(() => setEnvNotification(null), 4000);
        setActiveMainTab('runner');
      } catch (err) {
        alert('Invalid environment file format. Please upload a valid Postman Environment JSON or .env file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveWorkspaceTrigger = () => {
    const currentStore = useRunnerStore.getState();
    const activeNodesToSave = currentStore.rootNodes.length > 0 ? currentStore.rootNodes : currentStore.serverRootNodes;

    if (activeNodesToSave.length === 0) {
      alert('Workspace is currently empty. Please load or upload a Postman collection first.');
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
              <button
                onClick={() => setActiveMainTab('vault')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeMainTab === 'vault'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                <span>🛡️ Custom & AI Generated Test Use Cases Vault</span>
              </button>
            )}
          </div>

          <span className="hidden xl:inline-flex items-center text-[11px] text-slate-400 font-mono px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shrink-0">
            Active Workspace: <strong className="text-indigo-300 ml-1 truncate max-w-[220px]">{collectionName || 'Demo Suite'}</strong>
          </span>
        </div>

        {/* WORKSPACE FLEX CONTAINER: LEFT SIDEBAR + TAB CONTENTS */}
        <div className="flex flex-col lg:flex-row items-start gap-6 pt-2">
          
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

            {/* MAIN TAB 3: CUSTOM RULES VAULT */}
            {activeMainTab === 'vault' && workspaceMode === 'full' && (
              <CustomUseCasesVault />
            )}

          </div>
        </div>

      </main>

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

      {/* LOAD SERVER COLLECTION OVERRIDE CONFIRMATION MODAL (PORTAL) */}
      {pendingServerFileToLoad && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center space-x-3">
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

            <div className="flex items-center justify-end pt-2">
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

    </div>
  );
}
