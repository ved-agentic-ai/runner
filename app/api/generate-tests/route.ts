import { NextRequest, NextResponse } from 'next/server';
import { generateEndpointTests } from '@/lib/ai-test-generator';
import { TreeNode } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { node, resolvedUrl, geminiApiKey } = await req.json();

    if (!node || !resolvedUrl) {
      return NextResponse.json({ error: 'node and resolvedUrl are required' }, { status: 400 });
    }

    const testSuite = await generateEndpointTests(
      node as TreeNode, 
      resolvedUrl, 
      geminiApiKey || process.env.GEMINI_API_KEY
    );

    return NextResponse.json(testSuite);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate test suite' },
      { status: 500 }
    );
  }
}
