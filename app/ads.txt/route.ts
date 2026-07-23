import { NextResponse } from 'next/server';

export async function GET() {
  // Google AdSense ads.txt standard verification content
  // Note: Replace pub-1234567890123456 with your actual Publisher ID in Google AdSense
  const adsTxtContent = `google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(adsTxtContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
