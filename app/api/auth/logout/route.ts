import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.delete('vkratim_session_token');
  return res;
}
