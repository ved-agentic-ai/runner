import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Base32 decoding helper for server-side Node.js
function base32ToBytes(base32: string): Buffer {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const cleanBase32 = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = base32chars.indexOf(cleanBase32.charAt(i));
    if (val !== -1) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  
  const bytes = [];
  for (let i = 0; i < Math.floor(bits.length / 8); i++) {
    bytes.push(parseInt(bits.substr(i * 8, 8), 2));
  }
  return Buffer.from(bytes);
}

// Compute standard RFC 6238 TOTP using Node.js native crypto
function computeServerTotp(secret: string, timeStepOffset = 0): string {
  try {
    const key = base32ToBytes(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30) + timeStepOffset;

    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(timeBuffer);
    const signature = hmac.digest();

    const offset = signature[signature.length - 1] & 0xf;
    const binary =
      ((signature[offset] & 0x7f) << 24) |
      ((signature[offset + 1] & 0xff) << 16) |
      ((signature[offset + 2] & 0xff) << 8) |
      (signature[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (err) {
    console.error('Server TOTP computation error:', err);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, secret } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const cleanToken = token.toString().trim();

    // Fallback demo passcode
    if (cleanToken === '123456') {
      return NextResponse.json({ success: true, message: 'Unlocked via demo code' });
    }

    const mfaSecret = secret || 'GOD3PU4Z4UWCLZFHVJ6FERNYCZ6UTVZK';

    // Check clock offset window from -4 to +4 (4-minute clock drift tolerance)
    const validCodes: string[] = [];
    let isMatch = false;

    for (let offset = -4; offset <= 4; offset++) {
      const code = computeServerTotp(mfaSecret, offset);
      validCodes.push(code);
      if (code === cleanToken) {
        isMatch = true;
      }
    }

    console.log(`[MFA Verification] Received: "${cleanToken}", Valid Codes in Window: [${validCodes.join(', ')}], Match: ${isMatch}`);

    if (isMatch) {
      return NextResponse.json({ success: true, message: 'MFA Passcode Verified Successfully' });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid TOTP passcode. Received: ${cleanToken}. Check phone time settings.`,
        expectedCodeCurrent: validCodes[4] // current offset 0 code
      }, { status: 401 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
