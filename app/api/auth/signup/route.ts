import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { verifyOtpCode } from '@/app/api/auth/send-otp/route';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, otpCode } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Full name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in DB
    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 400 });
    }

    // Strictly Primary Owner Email
    const isOwner = cleanEmail === 'vedmtripathi@gmail.com';

    // Verify OTP if phone number or OTP code was requested
    if (phone || otpCode) {
      if (!otpCode) {
        return NextResponse.json({ success: false, error: 'OTP verification code is required when verifying identity' }, { status: 400 });
      }
      const isValidOtp = verifyOtpCode(cleanEmail, otpCode) || verifyOtpCode(phone, otpCode);
      if (!isValidOtp) {
        return NextResponse.json({ success: false, error: 'Invalid or expired OTP. Click "Request OTP Code" to receive a fresh verification code' }, { status: 401 });
      }
    }

    // Create user in database
    const newUser = await db.createUser({
      name,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: isOwner ? 'owner' : 'user',
      plan: isOwner ? 'pro' : 'free'
    });

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan,
      createdAt: newUser.createdAt
    };

    const res = NextResponse.json({ success: true, user: safeUser });

    // Set 30-day session cookie
    res.cookies.set('vkratim_session_token', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Registration failed' }, { status: 500 });
  }
}
