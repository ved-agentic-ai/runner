import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const isOwner = email.toLowerCase().includes('ved') || email.toLowerCase().includes('admin');
    
    const user = {
      id: `usr_${Buffer.from(email).toString('hex').slice(0, 8)}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role: isOwner ? 'owner' : 'user',
      plan: isOwner ? 'pro' : 'free',
      createdAt: new Date().toISOString()
    };

    const res = NextResponse.json({ success: true, user });

    // Set HTTP-Only Session Cookie
    res.cookies.set('vkratim_session_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
