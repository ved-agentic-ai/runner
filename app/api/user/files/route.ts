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
    const MAX_QUOTA_BYTES = 1048576; // 1 MB
    const usedBytes = files.reduce((acc, f) => acc + (f.content ? Buffer.byteLength(f.content, 'utf-8') : 0), 0);
    const remainingBytes = Math.max(0, MAX_QUOTA_BYTES - usedBytes);
    const usedPercentage = Math.min(100, Math.round((usedBytes / MAX_QUOTA_BYTES) * 100));

    return NextResponse.json({ 
      success: true, 
      files,
      quota: {
        maxBytes: MAX_QUOTA_BYTES,
        usedBytes,
        remainingBytes,
        usedPercentage
      }
    });
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

    const MAX_QUOTA_BYTES = 1048576; // 1 MB Limit
    const existingFiles = await db.getUserFiles(userId);
    // Exclude existing file with same name if updating
    const otherFiles = existingFiles.filter((f) => f.fileName !== fileName);
    const currentUsedBytes = otherFiles.reduce((acc, f) => acc + (f.content ? Buffer.byteLength(f.content, 'utf-8') : 0), 0);
    const newFileBytes = Buffer.byteLength(finalContent, 'utf-8');

    if (currentUsedBytes + newFileBytes > MAX_QUOTA_BYTES) {
      const remainingBytes = Math.max(0, MAX_QUOTA_BYTES - currentUsedBytes);
      return NextResponse.json({
        success: false,
        error: `Server Storage Quota Exceeded! Maximum 1.00 MB total server storage limit reached. Current usage: ${(currentUsedBytes / 1024).toFixed(1)} KB used, ${(remainingBytes / 1024).toFixed(1)} KB remaining. Payload size: ${(newFileBytes / 1024).toFixed(1)} KB.`,
        quotaExceeded: true,
        quota: {
          maxBytes: MAX_QUOTA_BYTES,
          usedBytes: currentUsedBytes,
          remainingBytes,
          usedPercentage: Math.min(100, Math.round((currentUsedBytes / MAX_QUOTA_BYTES) * 100))
        }
      }, { status: 400 });
    }

    const savedFile = await db.saveUserFile({
      userId,
      fileName,
      fileType: fileType || 'collection',
      content: finalContent,
      isRedacted
    });

    return NextResponse.json({ 
      success: true, 
      file: savedFile,
      quota: {
        maxBytes: MAX_QUOTA_BYTES,
        usedBytes: currentUsedBytes + newFileBytes,
        remainingBytes: Math.max(0, MAX_QUOTA_BYTES - (currentUsedBytes + newFileBytes)),
        usedPercentage: Math.min(100, Math.round(((currentUsedBytes + newFileBytes) / MAX_QUOTA_BYTES) * 100))
      }
    });
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
