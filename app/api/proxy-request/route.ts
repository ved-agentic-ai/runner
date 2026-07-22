import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const payload = await req.json();
    const { url, method = 'GET', headers = {}, body } = payload;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Build headers object for fetch
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Antigravity-API-Runner/1.0',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: fetchHeaders,
      cache: 'no-store',
    };

    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseText = await response.text();

    return NextResponse.json({
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs,
      requestHeaders: fetchHeaders,
      requestBody: fetchOptions.body ? String(fetchOptions.body) : undefined,
      responseHeaders,
      responseBody: responseText,
    });
  } catch (error: any) {
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);

    return NextResponse.json(
      {
        statusCode: 0,
        statusText: 'Network Error / Fetch Failed',
        responseTimeMs,
        error: error?.message || 'Failed to fetch resource',
        requestHeaders: {},
        responseHeaders: {},
        responseBody: '',
      },
      { status: 500 }
    );
  }
}
