export interface OtpQuotaUsage {
  smsSentThisMonth: number;
  emailSentThisMonth: number;
  smsMonthlyLimit: number;
  emailMonthlyLimit: number;
  lastResetMonth: string;
}

export const DEFAULT_OTP_QUOTA: OtpQuotaUsage = {
  smsSentThisMonth: 2,
  emailSentThisMonth: 5,
  smsMonthlyLimit: 10000,
  emailMonthlyLimit: 10000,
  lastResetMonth: new Date().toISOString().substring(0, 7)
};

export async function fetchOtpQuotaTelemetry(): Promise<OtpQuotaUsage> {
  try {
    const res = await fetch('/api/admin/otp-telemetry');
    const data = await res.json();
    if (data.success && data.quota) {
      return data.quota;
    }
  } catch (err) {}
  return DEFAULT_OTP_QUOTA;
}

export function recordOtpDispatch(type: 'sms' | 'email') {
  try {
    fetch(`/api/admin/otp-telemetry?action=record&type=${type}`, { method: 'POST' }).catch(() => {});
  } catch {}
}
