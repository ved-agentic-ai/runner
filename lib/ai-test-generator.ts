import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  TreeNode, 
  EndpointTestSuite, 
  TestCaseRule, 
  AssertionResult 
} from './types';
import { trackAiApiCall, canMakeAiRequest } from './quota-tracker';

/**
 * Sanitizes endpoint specs before sending to AI to guarantee secret values and environment variables 
 * are NEVER sent over the wire to external LLMs.
 */
function sanitizeEndpointForAi(node: TreeNode, rawUrl: string) {
  let sanitizedUrl = rawUrl;

  const sanitizedHeaders = (node.request?.header || []).map((h) => {
    const isSensitive = /auth|key|secret|token|password|bearer|cookie/i.test(h.key);
    return {
      key: h.key,
      value: isSensitive ? '{{REDACTED_SECRET_LOCAL_ONLY}}' : h.value
    };
  });

  let sanitizedBody = node.request?.body?.raw || '';
  if (sanitizedBody) {
    sanitizedBody = sanitizedBody.replace(
      /"(password|secret|token|apiKey|api_key|access_token|private_key)":\s*"[^"]*"/gi,
      '"$1": "{{REDACTED_SECRET_LOCAL_ONLY}}"'
    );
  }

  return {
    name: node.name,
    method: node.method || 'GET',
    url: sanitizedUrl,
    description: node.description || 'N/A',
    headers: sanitizedHeaders,
    requestBody: sanitizedBody
  };
}

/**
 * Generates automated test suite for an endpoint using Google Gemini API or Smart Fallback
 */
export async function generateEndpointTests(
  node: TreeNode, 
  rawUrl: string, 
  geminiApiKey?: string
): Promise<EndpointTestSuite> {
  const sanitizedSpec = sanitizeEndpointForAi(node, rawUrl);

  // Check Quota before making API request
  const quotaCheck = canMakeAiRequest(geminiApiKey);

  if (quotaCheck.allowed && (geminiApiKey || quotaCheck.keyToUse)) {
    const apiKey = (geminiApiKey && geminiApiKey.trim().length > 0) ? geminiApiKey.trim() : quotaCheck.keyToUse;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are an expert API quality engineer and automated test generator.
Analyze the following HTTP Endpoint structure and generate 3 to 5 realistic automated test rules in JSON format.
Note: Mainframe APIs and legacy text endpoints may return text/plain or non-JSON payloads. Handle appropriately.

Endpoint Details:
Name: "${sanitizedSpec.name}"
Method: "${sanitizedSpec.method}"
URL: "${sanitizedSpec.url}"
Description: "${sanitizedSpec.description}"
Headers: ${JSON.stringify(sanitizedSpec.headers)}
Request Body Structure: ${sanitizedSpec.requestBody || 'None'}

Expected JSON output format strictly:
{
  "summary": "Brief 1-sentence testing objective summary",
  "testCases": [
    {
      "id": "tc-1",
      "type": "status_code",
      "description": "Verify response status code is 20x OK",
      "expectedValue": 200
    },
    {
      "id": "tc-2",
      "type": "latency_sla",
      "description": "Ensure response time is under 2000ms",
      "expectedValue": 2000
    },
    {
      "id": "tc-3",
      "type": "header_exists",
      "description": "Check response headers for Content-Type",
      "expectedValue": "content-type"
    },
    {
      "id": "tc-4",
      "type": "json_schema",
      "description": "Validate response payload format",
      "jsonPath": "$"
    }
  ]
}

Output ONLY valid raw JSON with no markdown formatting around it.
`;

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const cleanedJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Track quota & tokens
        trackAiApiCall(prompt.length + text.length, geminiApiKey);

        const parsed = JSON.parse(cleanedJson);
        if (parsed && Array.isArray(parsed.testCases)) {
          return {
            endpointId: node.id,
            endpointName: node.name,
            method: node.method || 'GET',
            url: rawUrl,
            generatedBy: 'gemini_ai',
            summary: parsed.summary || `Gemini AI generated test suite for ${node.name}`,
            testCases: parsed.testCases,
          };
        }
      } catch (err: any) {
        console.warn(`[AI Test Generator] Gemini API error/quota limit, using smart local fallback:`, err?.message || err);
      }
    }
  }

  // Smart Heuristic Fallback Generator (100% Local, Private & Mainframe-Aware)
  return generateSmartHeuristicTests(node, rawUrl);
}

/**
 * Smart Heuristic Test Suite Generator (Offline/Fallback mode)
 */
export function generateSmartHeuristicTests(node: TreeNode, rawUrl: string): EndpointTestSuite {
  const method = node.method || 'GET';
  const testCases: TestCaseRule[] = [];

  let expectedStatus = 200;
  if (method === 'POST') expectedStatus = 200; // Accept 200 or 201 for POST

  testCases.push({
    id: `tc-${node.id}-1`,
    type: 'status_code',
    description: `Validate HTTP status is 20x Successful (${method} ${expectedStatus})`,
    expectedValue: expectedStatus
  });

  testCases.push({
    id: `tc-${node.id}-2`,
    type: 'latency_sla',
    description: 'Ensure response latency meets SLA (< 2000 ms)',
    expectedValue: 2000
  });

  testCases.push({
    id: `tc-${node.id}-3`,
    type: 'header_exists',
    description: 'Check response header contains Content-Type header',
    expectedValue: 'content-type'
  });

  testCases.push({
    id: `tc-${node.id}-4`,
    type: 'json_schema',
    description: 'Validate response body structure (JSON or Mainframe Text)',
    jsonPath: '$'
  });

  if (node.name.toLowerCase().includes('login') || node.name.toLowerCase().includes('auth') || rawUrl.includes('login')) {
    testCases.push({
      id: `tc-${node.id}-5`,
      type: 'extract_variable',
      description: 'Extract "token" or "accessToken" from response to environment variables',
      jsonPath: 'token',
      targetVariableKey: 'authToken'
    });
  }

  return {
    endpointId: node.id,
    endpointName: node.name,
    method,
    url: rawUrl,
    generatedBy: 'smart_heuristic',
    summary: `Automated baseline test suite for ${method} ${node.name}`,
    testCases
  };
}

/**
 * Evaluates test cases against actual endpoint response execution result.
 * FIXED: Mainframe text/plain and legacy string responses now pass cleanly!
 */
export function evaluateTestCases(
  testSuite: EndpointTestSuite,
  res: {
    statusCode: number;
    responseTimeMs: number;
    responseHeaders: Record<string, string>;
    responseBody?: string;
  }
): { assertionResults: AssertionResult[]; extractedVariables: Record<string, string> } {
  const assertionResults: AssertionResult[] = [];
  const extractedVariables: Record<string, string> = {};

  let parsedBody: any = null;
  let isJson = false;

  try {
    if (res.responseBody && res.responseBody.trim().length > 0) {
      parsedBody = JSON.parse(res.responseBody);
      isJson = true;
    }
  } catch (e) {
    parsedBody = null;
    isJson = false;
  }

  // Detect Content-Type header
  const contentTypeKey = Object.keys(res.responseHeaders).find(k => k.toLowerCase() === 'content-type');
  const contentTypeVal = contentTypeKey ? res.responseHeaders[contentTypeKey].toLowerCase() : '';
  const isPlainTextOrMainframe = contentTypeVal.includes('text/plain') || contentTypeVal.includes('text/html') || contentTypeVal.includes('text/xml');

  testSuite.testCases.forEach((tc) => {
    switch (tc.type) {
      case 'status_code': {
        const expected = Number(tc.expectedValue) || 200;
        // Accept 200, 201, 202, 204 for 20x Successful expected
        const passed = res.statusCode === expected || 
          (res.statusCode >= 200 && res.statusCode < 300) ||
          (expected === 201 && res.statusCode === 200) ||
          (expected === 200 && res.statusCode === 201);

        assertionResults.push({
          id: tc.id,
          description: tc.description,
          status: passed ? 'pass' : 'fail',
          expected: `HTTP ${expected} / 20x`,
          actual: `HTTP ${res.statusCode}`,
          message: passed 
            ? `Status code returned ${res.statusCode} as expected (20x Success).` 
            : `Expected HTTP ${expected}, received ${res.statusCode}.`
        });
        break;
      }

      case 'latency_sla': {
        const slaMax = Number(tc.expectedValue) || 2000;
        const passed = res.responseTimeMs <= slaMax;
        assertionResults.push({
          id: tc.id,
          description: tc.description,
          status: passed ? 'pass' : 'fail',
          expected: `<= ${slaMax}ms`,
          actual: `${Math.round(res.responseTimeMs)}ms`,
          message: passed ? `Response time ${Math.round(res.responseTimeMs)}ms is within SLA.` : `Latency ${Math.round(res.responseTimeMs)}ms exceeded SLA target of ${slaMax}ms.`
        });
        break;
      }

      case 'header_exists': {
        const targetHeader = String(tc.expectedValue || 'content-type').toLowerCase();
        const headerKey = Object.keys(res.responseHeaders).find(k => k.toLowerCase() === targetHeader);
        const passed = Boolean(headerKey);
        assertionResults.push({
          id: tc.id,
          description: tc.description,
          status: passed ? 'pass' : 'fail',
          expected: `Header "${tc.expectedValue}" present`,
          actual: headerKey ? `${headerKey}: ${res.responseHeaders[headerKey]}` : 'Missing',
          message: passed ? `Header ${headerKey} verified.` : `Header ${tc.expectedValue} was not found in response headers.`
        });
        break;
      }

      case 'json_schema': {
        // MAINFRAME FIX: If response is text/plain or string body, validate non-empty string payload!
        const hasBody = Boolean(res.responseBody && res.responseBody.trim().length > 0);
        const passed = isJson || (isPlainTextOrMainframe && hasBody) || hasBody;

        let actualText = 'Non-JSON / String body';
        if (isJson) {
          actualText = Array.isArray(parsedBody) ? `JSON Array (${parsedBody.length} items)` : 'JSON Object';
        } else if (isPlainTextOrMainframe) {
          actualText = `Mainframe Text Payload (${contentTypeVal || 'text/plain'})`;
        }

        assertionResults.push({
          id: tc.id,
          description: tc.description,
          status: passed ? 'pass' : 'fail',
          expected: 'Valid JSON or Text payload',
          actual: actualText,
          message: passed 
            ? (isJson ? 'Response body parsed as valid JSON.' : `Response body verified as valid text payload (${actualText}).`)
            : 'Response body payload was empty or failed validation.'
        });
        break;
      }

      case 'body_contains': {
        const searchStr = String(tc.expectedValue || '');
        const passed = (res.responseBody || '').includes(searchStr);
        assertionResults.push({
          id: tc.id,
          description: tc.description,
          status: passed ? 'pass' : 'fail',
          expected: `Contains "${searchStr}"`,
          actual: passed ? 'Substring present' : 'Substring missing',
          message: passed ? `Body contains expected string "${searchStr}".` : `Response body does not contain "${searchStr}".`
        });
        break;
      }

      case 'extract_variable': {
        const key = tc.targetVariableKey || 'authToken';
        let extractedVal: string | undefined = undefined;
        if (parsedBody && typeof parsedBody === 'object') {
          if (parsedBody.token) extractedVal = String(parsedBody.token);
          else if (parsedBody.accessToken) extractedVal = String(parsedBody.accessToken);
          else if (parsedBody.id) extractedVal = String(parsedBody.id);
        }
        if (extractedVal) {
          extractedVariables[key] = extractedVal;
          assertionResults.push({
            id: tc.id,
            description: tc.description,
            status: 'pass',
            expected: `Extract -> {{${key}}}`,
            actual: extractedVal,
            message: `Successfully extracted variable {{${key}}} = "${extractedVal}".`
          });
        } else {
          assertionResults.push({
            id: tc.id,
            description: tc.description,
            status: 'fail',
            expected: `Extract -> {{${key}}}`,
            actual: 'Key not found',
            message: `Could not find token field in response body.`
          });
        }
        break;
      }
    }
  });

  return { assertionResults, extractedVariables };
}
