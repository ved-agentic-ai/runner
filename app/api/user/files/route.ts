import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeEnvContent } from '@/lib/env-sanitizer';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const files = await db.getUserFiles(userId);
    return NextResponse.json({ success: true, files });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, fileName, fileType, content, allowRawSecrets } = await req.json();

    if (!userId || !fileName || !content) {
      return NextResponse.json({ success: false, error: 'User ID, filename, and content are required' }, { status: 400 });
    }

    let finalContent = content;
    let isRedacted = false;

    // Apply auto-redaction for .env files unless explicitly overridden by user
    if (fileType === 'env' && !allowRawSecrets) {
      const { sanitized } = sanitizeEnvContent(content);
      finalContent = sanitized;
      isRedacted = true;
    }

    const savedFile = await db.saveUserFile({
      userId,
      fileName,
      fileType: fileType || 'collection',
      content: finalContent,
      isRedacted
    });

    return NextResponse.json({ success: true, file: savedFile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get('fileId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!fileId || !userId) {
      return NextResponse.json({ success: false, error: 'File ID and User ID required' }, { status: 400 });
    }

    const deleted = await db.deleteUserFile(fileId, userId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
