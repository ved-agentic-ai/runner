import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Query database for existing user
    let user = await db.findUserByEmail(email);

    if (!user) {
      // Auto-register owner / first-time login
      const isOwner = email.toLowerCase().includes('ved') || email.toLowerCase().includes('admin');
      user = await db.createUser({
        name: email.split('@')[0].toUpperCase(),
        email,
        passwordHash: hashPassword(password),
        role: isOwner ? 'owner' : 'user',
        plan: isOwner ? 'pro' : 'free'
      });
    } else {
      // Verify password
      const inputHash = hashPassword(password);
      if (user.passwordHash !== inputHash) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt
    };

    const res = NextResponse.json({ success: true, user: safeUser });

    res.cookies.set('vkratim_session_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
