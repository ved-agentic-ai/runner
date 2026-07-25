import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface OtpQuotaUsage {
  smsSentThisMonth: number;
  emailSentThisMonth: number;
  smsMonthlyLimit: number;
  emailMonthlyLimit: number;
  lastResetMonth: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'server_config.json');

export async function GET() {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const defaultQuota: OtpQuotaUsage = {
    smsSentThisMonth: 2,
    emailSentThisMonth: 5,
    smsMonthlyLimit: 10000,
    emailMonthlyLimit: 10000,
    lastResetMonth: currentMonth
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (data.otpQuota) {
        if (data.otpQuota.lastResetMonth !== currentMonth) {
          data.otpQuota.smsSentThisMonth = 0;
          data.otpQuota.emailSentThisMonth = 0;
          data.otpQuota.lastResetMonth = currentMonth;
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
        return NextResponse.json({ success: true, quota: { ...defaultQuota, ...data.otpQuota } });
      }
    }
  } catch (err) {}

  return NextResponse.json({ success: true, quota: defaultQuota });
}
