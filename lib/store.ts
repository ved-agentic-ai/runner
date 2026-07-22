import { create } from 'zustand';
import { 
  TreeNode, 
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
  evaluateTestCases 
} from './ai-test-generator';

interface RunnerState {
  collectionName: string;
  collectionDescription: string;
  rootNodes: TreeNode[];
  flatEndpointMap: Map<string, TreeNode>;
  envVariables: Record<string, string>;
  selectedNodeIds: string[]; // List of checked node IDs (folder or endpoint)
  generatedTestSuites: Record<string, EndpointTestSuite>;
  executionResults: Record<string, EndpointExecutionResult>;
  runSummary: RunSummary;
  selectedEndpointIdForDetail: string | null;
  geminiApiKey: string;
  isGeneratingAiTests: boolean;
  searchQuery: string;
  filterStatus: 'all' | 'passed' | 'failed' | 'running';

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
  generateAiTestsForSelected: () => Promise<void>;
  runSelectedEndpoints: () => Promise<void>;
  clearResults: () => void;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  collectionName: '',
  collectionDescription: '',
  rootNodes: [],
  flatEndpointMap: new Map(),
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

    set({
      collectionName: collectionJson.info?.name || 'Uploaded Collection',
      collectionDescription: collectionJson.info?.description || '',
      rootNodes,
      flatEndpointMap,
      envVariables: envVars,
      selectedNodeIds: allNodeIds,
      executionResults: {},
      generatedTestSuites: {},
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

    set({
      collectionName: DEMO_COLLECTION_JSON.info.name,
      collectionDescription: DEMO_COLLECTION_JSON.info.description || '',
      rootNodes,
      flatEndpointMap,
      envVariables: envVars,
      selectedNodeIds: allNodeIds,
      executionResults: {},
      generatedTestSuites: {},
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
    const { rootNodes, selectedNodeIds } = get();
    
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

    const node = findNode(rootNodes, nodeId);
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
    const { rootNodes } = get();
    const allNodeIds: string[] = [];
    function collectAllNodeIds(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        allNodeIds.push(n.id);
        if (n.children) collectAllNodeIds(n.children);
      });
    }
    collectAllNodeIds(rootNodes);
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

  generateAiTestsForSelected: async () => {
    const { flatEndpointMap, geminiApiKey } = get();
    set({ isGeneratingAiTests: true });

    const suites: Record<string, EndpointTestSuite> = {};
    const endpoints = Array.from(flatEndpointMap.values());

    for (const ep of endpoints) {
      // Pass raw URL with {{placeholder}} to guarantee secrets are NEVER sent over the wire to LLM
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

      // Secret values are only injected HERE locally on client/runner proxy execution
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
}));
