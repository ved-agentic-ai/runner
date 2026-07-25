import { NextRequest, NextResponse } from 'next/server';
import { serverConfigEngine } from '@/lib/server-config';

export async function GET(req: NextRequest) {
  try {
    const data = serverConfigEngine.get();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mfaToken, settingKey, newValue, actor } = body;

    // Verify MFA token (123456 or MFA secret authentication)
    if (mfaToken !== '123456' && mfaToken !== 'VERIFIED_MFA_SESSION') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid MFA Passcode required to modify backend configurations' },
        { status: 401 }
      );
    }

    if (!settingKey) {
      return NextResponse.json({ success: false, error: 'Setting key is required' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const updatedData = serverConfigEngine.updateSetting(
      settingKey,
      newValue,
      actor || 'Owner (Ved Tripathi / MFA Verified)',
      clientIp
    );

    return NextResponse.json({ success: true, ...updatedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
