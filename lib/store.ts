import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  TreeNode, 
  HttpMethod,
  PostmanCollection, 
  PostmanEnvironment, 
  EndpointTestSuite, 
  EndpointExecutionResult, 
  RunSummary 
} from './types';
import { 
  parsePostmanCollection, 
  parsePostmanEnvironment, 
  resolveVariables, 
  DEMO_COLLECTION_JSON, 
  DEMO_ENVIRONMENT_VARIABLES 
} from './postman-parser';
import { 
  generateEndpointTests, 
  generateSmartHeuristicTests,
  evaluateTestCases 
} from './ai-test-generator';

interface RunnerState {
  collectionName: string;
  collectionDescription: string;
  rootNodes: TreeNode[];
  flatEndpointMap: Map<string, TreeNode>;

  // Dual Workspace Tab Support (Local Upload vs Server Cloud)
  serverCollectionName: string;
  serverRootNodes: TreeNode[];
  serverFlatEndpointMap: Map<string, TreeNode>;
  activeWorkspaceSource: 'local' | 'server';
  setActiveWorkspaceSource: (source: 'local' | 'server') => void;

  envVariables: Record<string, string>;
  selectedNodeIds: string[]; // List of checked node IDs (folder or endpoint)
  generatedTestSuites: Record<string, EndpointTestSuite>;
  executionResults: Record<string, EndpointExecutionResult>;
  runSummary: RunSummary;
  selectedEndpointIdForDetail: string | null;
  // inspectorEndpointId: used ONLY for the right-side drawer inspector (results table row click)
  // This is separate from selectedEndpointIdForDetail which drives the inline workbench
  inspectorEndpointId: string | null;
  geminiApiKey: string;
  isGeneratingAiTests: boolean;
  searchQuery: string;
  filterStatus: 'all' | 'passed' | 'failed' | 'running';

  // Pane Focus / Maximize State: 'sidebar' | 'tree' | 'telemetry' | null
  maximizedPane: 'sidebar' | 'tree' | 'telemetry' | null;
  setMaximizedPane: (pane: 'sidebar' | 'tree' | 'telemetry' | null) => void;
  toggleMaximizePane: (pane: 'sidebar' | 'tree' | 'telemetry') => void;

  // Theme Functionality: 'dark' | 'midnight' | 'emerald' | 'light'
  theme: 'dark' | 'midnight' | 'emerald' | 'light';
  setTheme: (theme: 'dark' | 'midnight' | 'emerald' | 'light') => void;

  // Actions
  loadCollection: (collectionJson: PostmanCollection, envJson?: PostmanEnvironment) => void;
  loadDemoCollection: () => void;
  toggleNodeSelection: (nodeId: string) => void;
  selectAllNodes: () => void;
  deselectAllNodes: () => void;
  setGeminiApiKey: (key: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'passed' | 'failed' | 'running') => void;
  setSelectedEndpointIdForDetail: (id: string | null) => void;
  setInspectorEndpointId: (id: string | null) => void;
  updateEndpointName: (id: string, newName: string) => void;
  duplicateNode: (nodeId: string) => void;
  moveNode: (nodeId: string, direction: 'up' | 'down') => void;
  addFolderNode: (parentId: string | null, name: string) => void;
  addEndpointNode: (parentId: string | null, name: string, method: HttpMethod, url: string) => void;
  deleteNode: (nodeId: string) => void;
  exportCollection: (selectedOnly?: boolean) => void;
  generateAiTestsForSelected: () => Promise<void>;
  runSelectedEndpoints: () => Promise<void>;
  clearResults: () => void;
  resetFullWorkspace: () => void;
}

export const useRunnerStore = create<RunnerState>()(
  persist(
    (set, get) => ({
      collectionName: '',
      collectionDescription: '',
      rootNodes: [],
      flatEndpointMap: new Map(),

      serverCollectionName: '',
      serverRootNodes: [],
      serverFlatEndpointMap: new Map(),
      activeWorkspaceSource: 'local',
      setActiveWorkspaceSource: (source) => set({ activeWorkspaceSource: source }),

      maximizedPane: null,
      setMaximizedPane: (pane) => set({ maximizedPane: pane }),
      toggleMaximizePane: (pane) => set((state) => ({ maximizedPane: state.maximizedPane === pane ? null : pane })),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      envVariables: {},
      selectedNodeIds: [],
      generatedTestSuites: {},
      executionResults: {},
      runSummary: {
        total: 0,
        passed: 0,
        failed: 0,
        running: 0,
        pending: 0,
        avgLatencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        status: 'idle',
      },
      selectedEndpointIdForDetail: null,
      inspectorEndpointId: null,
      geminiApiKey: '',
      isGeneratingAiTests: false,
      searchQuery: '',
      filterStatus: 'all',

      loadCollection: (collectionJson, envJson) => {
        const { rootNodes, flatEndpointMap } = parsePostmanCollection(collectionJson);
        const envVars = envJson ? parsePostmanEnvironment(envJson) : {};

        const allEndpointIds = Array.from(flatEndpointMap.keys());
        const allNodeIds: string[] = [];
        
        function collectAllNodeIds(nodes: TreeNode[]) {
          nodes.forEach((n) => {
            allNodeIds.push(n.id);
            if (n.children) collectAllNodeIds(n.children);
          });
        }
        collectAllNodeIds(rootNodes);

        const defaultSuites: Record<string, EndpointTestSuite> = {};
        flatEndpointMap.forEach((node, id) => {
          defaultSuites[id] = generateSmartHeuristicTests(node, node.url || '');
        });

        set({
          collectionName: collectionJson.info?.name || 'Uploaded Collection',
          collectionDescription: collectionJson.info?.description || '',
          rootNodes,
          flatEndpointMap,
          envVariables: envVars,
          selectedNodeIds: allNodeIds,
          executionResults: {},
          generatedTestSuites: defaultSuites,
          runSummary: {
            total: allEndpointIds.length,
            passed: 0,
            failed: 0,
            running: 0,
            pending: allEndpointIds.length,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            status: 'idle',
          },
        });

        get().generateAiTestsForSelected();
      },

      loadDemoCollection: () => {
        const { rootNodes, flatEndpointMap } = parsePostmanCollection(DEMO_COLLECTION_JSON);
        const envVars = { ...DEMO_ENVIRONMENT_VARIABLES };

        const allNodeIds: string[] = [];
        function collectAllNodeIds(nodes: TreeNode[]) {
          nodes.forEach((n) => {
            allNodeIds.push(n.id);
            if (n.children) collectAllNodeIds(n.children);
          });
        }
        collectAllNodeIds(rootNodes);

        const defaultSuites: Record<string, EndpointTestSuite> = {};
        flatEndpointMap.forEach((node, id) => {
          defaultSuites[id] = generateSmartHeuristicTests(node, node.url || '');
        });

        set({
          collectionName: DEMO_COLLECTION_JSON.info.name,
          collectionDescription: DEMO_COLLECTION_JSON.info.description || '',
          rootNodes,
          flatEndpointMap,
          envVariables: envVars,
          selectedNodeIds: allNodeIds,
          executionResults: {},
          generatedTestSuites: defaultSuites,
          runSummary: {
            total: flatEndpointMap.size,
            passed: 0,
            failed: 0,
            running: 0,
            pending: flatEndpointMap.size,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            status: 'idle',
          },
        });

        get().generateAiTestsForSelected();
      },

      toggleNodeSelection: (nodeId: string) => {
        const { rootNodes, serverRootNodes, activeWorkspaceSource, selectedNodeIds } = get();
        const activeNodes = (activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0)
          ? serverRootNodes
          : rootNodes;

        function findNode(nodes: TreeNode[], id: string): TreeNode | null {
          for (const n of nodes) {
            if (n.id === id) return n;
            if (n.children) {
              const found = findNode(n.children, id);
              if (found) return found;
            }
          }
          return null;
        }

        let node = findNode(activeNodes, nodeId);
        if (!node) node = findNode(rootNodes, nodeId);
        if (!node) node = findNode(serverRootNodes, nodeId);
        if (!node) return;

        function getAllSubNodeIds(n: TreeNode): string[] {
          let ids = [n.id];
          if (n.children) {
            n.children.forEach((c) => {
              ids = ids.concat(getAllSubNodeIds(c));
            });
          }
          return ids;
        }

        const subIds = getAllSubNodeIds(node);
        const isCurrentlySelected = selectedNodeIds.includes(nodeId);

        let nextSelected: string[];
        if (isCurrentlySelected) {
          nextSelected = selectedNodeIds.filter((id) => !subIds.includes(id));
        } else {
          const newSet = new Set([...selectedNodeIds, ...subIds]);
          nextSelected = Array.from(newSet);
        }

        set({ selectedNodeIds: nextSelected });
      },

      selectAllNodes: () => {
        const { rootNodes, serverRootNodes, activeWorkspaceSource } = get();
        const activeNodes = (activeWorkspaceSource === 'server' && serverRootNodes.length > 0) || (rootNodes.length === 0 && serverRootNodes.length > 0)
          ? serverRootNodes
          : rootNodes;

        const allNodeIds: string[] = [];
        function collectAllNodeIds(nodes: TreeNode[]) {
          nodes.forEach((n) => {
            allNodeIds.push(n.id);
            if (n.children) collectAllNodeIds(n.children);
          });
        }
        collectAllNodeIds(activeNodes);
        set({ selectedNodeIds: allNodeIds });
      },

      deselectAllNodes: () => {
        set({ selectedNodeIds: [] });
      },

      setGeminiApiKey: (key: string) => {
        set({ geminiApiKey: key });
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSelectedEndpointIdForDetail: (id) => set({ selectedEndpointIdForDetail: id }),
      setInspectorEndpointId: (id) => set({ inspectorEndpointId: id }),

      updateEndpointName: (id: string, newName: string) => {
        const { rootNodes, flatEndpointMap, serverRootNodes, serverFlatEndpointMap, generatedTestSuites } = get();

        function updateInTree(nodes: TreeNode[]): boolean {
          for (const node of nodes) {
            if (node.id === id) {
              node.name = newName;
              return true;
            }
            if (node.children && updateInTree(node.children)) {
              return true;
            }
          }
          return false;
        }

        const updatedRoots = [...rootNodes];
        updateInTree(updatedRoots);

        const newFlatMap = new Map(flatEndpointMap);
        const targetNode = newFlatMap.get(id);
        if (targetNode) {
          newFlatMap.set(id, { ...targetNode, name: newName });
        }

        const updatedServerRoots = [...serverRootNodes];
        updateInTree(updatedServerRoots);

        const newServerFlatMap = new Map(serverFlatEndpointMap);
        const targetServerNode = newServerFlatMap.get(id);
        if (targetServerNode) {
          newServerFlatMap.set(id, { ...targetServerNode, name: newName });
        }

        const updatedSuites = { ...generatedTestSuites };
        if (updatedSuites[id]) {
          updatedSuites[id] = { ...updatedSuites[id], endpointName: newName };
        }

        set({
          rootNodes: updatedRoots,
          flatEndpointMap: newFlatMap,
          serverRootNodes: updatedServerRoots,
          serverFlatEndpointMap: newServerFlatMap,
          generatedTestSuites: updatedSuites,
        });
      },

      duplicateNode: (nodeId: string) => {
        const { rootNodes, flatEndpointMap } = get();

        function cloneTree(n: TreeNode): TreeNode {
          const newId = `ep_copy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          return {
            ...n,
            id: newId,
            name: `${n.name} (Copy)`,
            children: n.children ? n.children.map(cloneTree) : undefined,
          };
        }

        function insertInTree(list: TreeNode[]): TreeNode[] {
          const res: TreeNode[] = [];
          for (const item of list) {
            res.push(item);
            if (item.id === nodeId) {
              res.push(cloneTree(item));
            } else if (item.children) {
              item.children = insertInTree(item.children);
            }
          }
          return res;
        }

        const newRoots = insertInTree([...rootNodes]);
        const newFlatMap = new Map<string, TreeNode>();
        function rebuildMap(nodes: TreeNode[]) {
          nodes.forEach((n) => {
            if (n.type === 'endpoint') newFlatMap.set(n.id, n);
            if (n.children) rebuildMap(n.children);
          });
        }
        rebuildMap(newRoots);

        set({ rootNodes: newRoots, flatEndpointMap: newFlatMap });
      },

      moveNode: (nodeId: string, direction: 'up' | 'down') => {
        const { rootNodes } = get();

        function moveInList(list: TreeNode[]): boolean {
          const idx = list.findIndex((n) => n.id === nodeId);
          if (idx !== -1) {
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx >= 0 && targetIdx < list.length) {
              const [moved] = list.splice(idx, 1);
              list.splice(targetIdx, 0, moved);
              return true;
            }
          }
          for (const item of list) {
            if (item.children && moveInList(item.children)) return true;
          }
          return false;
        }

        const newRoots = [...rootNodes];
        moveInList(newRoots);
        set({ rootNodes: newRoots });
      },

      addFolderNode: (parentId: string | null, name: string) => {
        const { rootNodes } = get();
        const newFolder: TreeNode = {
          id: `folder_${Date.now()}`,
          name: name || 'New Folder',
          type: 'folder',
          path: name || 'New Folder',
          children: [],
        };

        const newRoots = [...rootNodes];
        if (!parentId) {
          newRoots.push(newFolder);
        } else {
          function addToParent(list: TreeNode[]) {
            for (const item of list) {
              if (item.id === parentId) {
                if (!item.children) item.children = [];
                item.children.push(newFolder);
                return true;
              }
              if (item.children && addToParent(item.children)) return true;
            }
            return false;
          }
          addToParent(newRoots);
        }
        set({ rootNodes: newRoots });
      },

      addEndpointNode: (parentId: string | null, name: string, method: HttpMethod, url: string) => {
        const { rootNodes, flatEndpointMap } = get();
        const id = `ep_new_${Date.now()}`;
        const newEp: TreeNode = {
          id,
          name: name || 'New Endpoint',
          type: 'endpoint',
          method: method || 'GET',
          url: url || 'https://api.example.com/v1/resource',
          path: url || 'https://api.example.com/v1/resource',
          request: {
            method: method || 'GET',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: { mode: 'raw', raw: '{\n  "key": "value"\n}' },
            url: { raw: url || 'https://api.example.com/v1/resource' }
          }
        };

        const newRoots = [...rootNodes];
        if (!parentId) {
          newRoots.push(newEp);
        } else {
          function addToParent(list: TreeNode[]) {
            for (const item of list) {
              if (item.id === parentId) {
                if (!item.children) item.children = [];
                item.children.push(newEp);
                return true;
              }
              if (item.children && addToParent(item.children)) return true;
            }
            return false;
          }
          addToParent(newRoots);
        }

        const newFlatMap = new Map(flatEndpointMap);
        newFlatMap.set(id, newEp);
        set({ rootNodes: newRoots, flatEndpointMap: newFlatMap, selectedEndpointIdForDetail: id });
      },

      deleteNode: (nodeId: string) => {
        const { rootNodes, serverRootNodes, flatEndpointMap, serverFlatEndpointMap, selectedNodeIds, selectedEndpointIdForDetail } = get();

        function removeSubTree(nodes: TreeNode[]): TreeNode[] {
          return nodes.filter(n => n.id !== nodeId).map(n => ({
            ...n,
            children: n.children ? removeSubTree(n.children) : undefined
          }));
        }

        const newRoots = removeSubTree([...rootNodes]);
        const newServerRoots = removeSubTree([...serverRootNodes]);

        const newFlatMap = new Map(flatEndpointMap);
        newFlatMap.delete(nodeId);

        const newServerFlatMap = new Map(serverFlatEndpointMap);
        newServerFlatMap.delete(nodeId);

        const nextSelectedNodeIds = selectedNodeIds.filter(id => id !== nodeId);
        const nextDetailId = selectedEndpointIdForDetail === nodeId ? null : selectedEndpointIdForDetail;

        set({
          rootNodes: newRoots,
          serverRootNodes: newServerRoots,
          flatEndpointMap: newFlatMap,
          serverFlatEndpointMap: newServerFlatMap,
          selectedNodeIds: nextSelectedNodeIds,
          selectedEndpointIdForDetail: nextDetailId
        });
      },

      exportCollection: (selectedOnly = false) => {
        const { rootNodes, collectionName, selectedNodeIds } = get();
        const selSet = new Set(selectedNodeIds);

        function convertNodeToPostman(n: TreeNode): any {
          if (selectedOnly && !selSet.has(n.id)) return null;

          if (n.type === 'folder') {
            const items = (n.children || [])
              .map(convertNodeToPostman)
              .filter(Boolean);
            if (selectedOnly && items.length === 0) return null;
            return {
              name: n.name,
              item: items,
            };
          }

          return {
            name: n.name,
            request: n.request || {
              method: n.method || 'GET',
              url: n.url || '',
              header: [{ key: 'Content-Type', value: 'application/json' }],
            },
          };
        }

        const items = rootNodes.map(convertNodeToPostman).filter(Boolean);
        const postmanCollection = {
          info: {
            name: selectedOnly ? `${collectionName || 'Collection'} (Selected)` : (collectionName || 'Collection'),
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
          },
          item: items,
        };

        const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${(selectedOnly ? `${collectionName || 'collection'}_selected` : (collectionName || 'collection')).toLowerCase().replace(/\s+/g, '_')}_postman_collection.json`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      },

      generateAiTestsForSelected: async () => {
        const { flatEndpointMap, geminiApiKey } = get();
        set({ isGeneratingAiTests: true });

        const suites: Record<string, EndpointTestSuite> = {};
        const endpoints = Array.from(flatEndpointMap.values());

        for (const ep of endpoints) {
          const rawUrl = ep.url || '';
          try {
            const testSuite = await generateEndpointTests(ep, rawUrl, geminiApiKey);
            suites[ep.id] = testSuite;
          } catch (err) {
            console.error(`Failed to generate tests for ${ep.name}`, err);
          }
        }

        set({ generatedTestSuites: suites, isGeneratingAiTests: false });
      },

      runSelectedEndpoints: async () => {
        const { 
          flatEndpointMap, 
          selectedNodeIds, 
          envVariables, 
          generatedTestSuites 
        } = get();

        const selectedEndpoints = Array.from(flatEndpointMap.values()).filter(
          (ep) => selectedNodeIds.includes(ep.id)
        );

        if (selectedEndpoints.length === 0) return;

        const initialResults: Record<string, EndpointExecutionResult> = {};
        selectedEndpoints.forEach((ep) => {
          const resolvedUrl = resolveVariables(ep.url || '', envVariables);
          initialResults[ep.id] = {
            endpointId: ep.id,
            name: ep.name,
            method: ep.method || 'GET',
            url: ep.url || '',
            resolvedUrl,
            status: 'pending',
            responseTimeMs: 0,
            requestHeaders: {},
            responseHeaders: {},
            assertionResults: [],
            executedAt: new Date().toISOString(),
          };
        });

        set({
          executionResults: initialResults,
          runSummary: {
            total: selectedEndpoints.length,
            passed: 0,
            failed: 0,
            running: selectedEndpoints.length,
            pending: selectedEndpoints.length,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            startTime: new Date().toISOString(),
            status: 'running',
          },
        });

        const currentEnv = { ...envVariables };
        let passedCount = 0;
        let failedCount = 0;
        const latencies: number[] = [];

        for (let i = 0; i < selectedEndpoints.length; i++) {
          const ep = selectedEndpoints[i];
          
          set((state) => ({
            executionResults: {
              ...state.executionResults,
              [ep.id]: { ...state.executionResults[ep.id], status: 'running' },
            },
          }));

          const resolvedUrl = resolveVariables(ep.url || '', currentEnv);
          const reqHeaders: Record<string, string> = {};
          if (ep.request?.header) {
            ep.request.header.forEach((h) => {
              if (h.enabled !== false && h.key) {
                reqHeaders[h.key] = resolveVariables(h.value || '', currentEnv);
              }
            });
          }

          if (currentEnv.authToken && !reqHeaders['Authorization']) {
            reqHeaders['Authorization'] = `Bearer ${currentEnv.authToken}`;
          }

          let reqBody: string | undefined = undefined;
          if (ep.request?.body?.raw) {
            reqBody = resolveVariables(ep.request.body.raw, currentEnv);
          }

          try {
            const response = await fetch('/api/proxy-request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: resolvedUrl,
                method: ep.method || 'GET',
                headers: reqHeaders,
                body: reqBody,
              }),
            });

            const resData = await response.json();
            const responseTimeMs = resData.responseTimeMs || 0;
            latencies.push(responseTimeMs);

            const testSuite = generatedTestSuites[ep.id] || {
              endpointId: ep.id,
              endpointName: ep.name,
              method: ep.method || 'GET',
              url: resolvedUrl,
              generatedBy: 'smart_heuristic',
              summary: 'Baseline check',
              testCases: [
                { id: 't1', type: 'status_code', description: 'HTTP 200 OK Check', expectedValue: 200 },
                { id: 't2', type: 'latency_sla', description: 'Latency check < 2000ms', expectedValue: 2000 },
              ],
            };

            const { assertionResults, extractedVariables } = evaluateTestCases(testSuite, {
              statusCode: resData.statusCode,
              responseTimeMs,
              responseHeaders: resData.responseHeaders || {},
              responseBody: resData.responseBody,
            });

            Object.assign(currentEnv, extractedVariables);

            const allPassed = assertionResults.length > 0 && assertionResults.every((a) => a.status === 'pass');
            const epStatus = allPassed ? 'passed' : 'failed';

            if (epStatus === 'passed') passedCount++;
            else failedCount++;

            const updatedResult: EndpointExecutionResult = {
              endpointId: ep.id,
              name: ep.name,
              method: ep.method || 'GET',
              url: ep.url || '',
              resolvedUrl,
              status: epStatus,
              statusCode: resData.statusCode,
              statusText: resData.statusText,
              responseTimeMs,
              requestHeaders: resData.requestHeaders || reqHeaders,
              requestBody: reqBody,
              responseHeaders: resData.responseHeaders || {},
              responseBody: resData.responseBody,
              assertionResults,
              extractedVariables,
              executedAt: new Date().toISOString(),
            };

            set((state) => ({
              envVariables: { ...currentEnv },
              executionResults: {
                ...state.executionResults,
                [ep.id]: updatedResult,
              },
              runSummary: {
                ...state.runSummary,
                passed: passedCount,
                failed: failedCount,
                pending: selectedEndpoints.length - (i + 1),
                avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
                minLatencyMs: Math.min(...latencies),
                maxLatencyMs: Math.max(...latencies),
              },
            }));
          } catch (err: any) {
            failedCount++;
            set((state) => ({
              executionResults: {
                ...state.executionResults,
                [ep.id]: {
                  ...state.executionResults[ep.id],
                  status: 'failed',
                  error: err?.message || 'Execution error',
                },
              },
              runSummary: {
                ...state.runSummary,
                failed: failedCount,
                pending: selectedEndpoints.length - (i + 1),
              },
            }));
          }
        }

        set((state) => ({
          runSummary: {
            ...state.runSummary,
            endTime: new Date().toISOString(),
            status: 'completed',
            running: 0,
          },
        }));
      },

      clearResults: () => {
        const { flatEndpointMap } = get();
        set({
          executionResults: {},
          runSummary: {
            total: flatEndpointMap.size,
            passed: 0,
            failed: 0,
            running: 0,
            pending: flatEndpointMap.size,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            status: 'idle',
          },
        });
      },

      resetFullWorkspace: () => {
        set({
          collectionName: '',
          collectionDescription: '',
          rootNodes: [],
          flatEndpointMap: new Map(),

          serverCollectionName: '',
          serverRootNodes: [],
          serverFlatEndpointMap: new Map(),
          activeWorkspaceSource: 'local',

          envVariables: {},
          selectedNodeIds: [],
          generatedTestSuites: {},
          executionResults: {},
          runSummary: {
            total: 0,
            passed: 0,
            failed: 0,
            running: 0,
            pending: 0,
            avgLatencyMs: 0,
            minLatencyMs: 0,
            maxLatencyMs: 0,
            status: 'idle',
          },
          selectedEndpointIdForDetail: null,
          searchQuery: '',
          filterStatus: 'all',
        });
      },
    }),
    {
      name: 'runner_main_store_v2',
      // Exclude non-serializable Map objects from localStorage to prevent JSON errors
      partialize: (state) => {
        const { flatEndpointMap, serverFlatEndpointMap, isGeneratingAiTests, ...rest } = state;
        return rest as any;
      },
      // Rebuild flat Maps from tree nodes after rehydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Helper: flatten tree nodes into a Map
        function flattenNodes(nodes: TreeNode[], map: Map<string, TreeNode>) {
          nodes.forEach((node) => {
            map.set(node.id, node);
            if (node.children) flattenNodes(node.children, map);
          });
        }

        // Rebuild flatEndpointMap from rootNodes
        const newFlatMap = new Map<string, TreeNode>();
        if (state.rootNodes?.length) {
          flattenNodes(state.rootNodes, newFlatMap);
        }

        // Rebuild serverFlatEndpointMap from serverRootNodes
        const newServerFlatMap = new Map<string, TreeNode>();
        if (state.serverRootNodes?.length) {
          flattenNodes(state.serverRootNodes, newServerFlatMap);
        }

        useRunnerStore.setState({
          flatEndpointMap: newFlatMap,
          serverFlatEndpointMap: newServerFlatMap,
        });
      }
    }
  )
);
