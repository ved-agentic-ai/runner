import { DEMO_COLLECTION_JSON, parsePostmanCollection, resolveVariables } from '../lib/postman-parser';
import { generateEndpointTests, evaluateTestCases } from '../lib/ai-test-generator';

async function testFullRunnerFlow() {
  console.log('--- Testing Full Postman Collection Runner Execution ---');
  const { rootNodes, flatEndpointMap } = parsePostmanCollection(DEMO_COLLECTION_JSON);
  console.log(`Parsed Collection: "${DEMO_COLLECTION_JSON.info.name}" with ${flatEndpointMap.size} total endpoints.`);

  const env = {
    baseUrl: 'https://jsonplaceholder.typicode.com',
    apiKey: 'demo-key'
  };

  let passed = 0;
  let failed = 0;

  for (const [id, node] of flatEndpointMap.entries()) {
    const rawUrl = node.url || '';
    const resolvedUrl = resolveVariables(rawUrl, env);
    console.log(`\nExecuting: [${node.method}] ${node.name} -> ${resolvedUrl}`);

    // Generate AI test suite (async)
    const testSuite = await generateEndpointTests(node, resolvedUrl);
    console.log(`Generated ${testSuite.testCases.length} AI test rules (${testSuite.generatedBy}).`);

    // Execute via proxy
    const proxyRes = await fetch('http://localhost:3000/api/proxy-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: resolvedUrl,
        method: node.method,
        body: node.request?.body?.raw ? resolveVariables(node.request.body.raw, env) : undefined
      })
    });

    const resData = await proxyRes.json();

    // Evaluate assertions
    const { assertionResults, extractedVariables } = evaluateTestCases(testSuite, {
      statusCode: resData.statusCode,
      responseTimeMs: resData.responseTimeMs,
      responseHeaders: resData.responseHeaders || {},
      responseBody: resData.responseBody
    });

    Object.assign(env, extractedVariables);

    const allPassed = assertionResults.every(a => a.status === 'pass');
    if (allPassed) passed++;
    else failed++;

    console.log(`Result: ${allPassed ? '✅ PASSED' : '❌ FAILED'} | Status ${resData.statusCode} | ${resData.responseTimeMs}ms`);
    assertionResults.forEach(a => {
      console.log(`  - [${a.status.toUpperCase()}] ${a.description}: ${a.message}`);
    });
  }

  console.log(`\n=== FINAL RUN SUMMARY ===`);
  console.log(`Total: ${flatEndpointMap.size} | Passed: ${passed} | Failed: ${failed}`);
}

testFullRunnerFlow();
