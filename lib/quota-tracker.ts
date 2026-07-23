export interface QuotaState {
  mode: 'user_key' | 'app_demo_key';
  requestsUsed: number;
  maxDemoRequests: number;
  totalTokensEstimated: number;
  rateLimitStatus: 'ok' | 'throttled' | 'quota_exceeded';
  lastCallTimestamp?: string;
  quotaExceededTimestamp?: number; // Epoch timestamp when 3/3 limit reached
  cooldownRemainingMs?: number;
  cooldownFormatted?: string;
}

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

let currentQuota: QuotaState = {
  mode: 'app_demo_key',
  requestsUsed: 0,
  maxDemoRequests: 3,
  totalTokensEstimated: 0,
  rateLimitStatus: 'ok'
};

export function getQuotaState(userApiKey?: string): QuotaState {
  const now = Date.now();

  // Automatic 5-Hour Cooldown Check
  if (currentQuota.quotaExceededTimestamp) {
    const elapsed = now - currentQuota.quotaExceededTimestamp;
    if (elapsed >= FIVE_HOURS_MS) {
      // 5 hours passed: automatically reset quota
      resetDemoQuotaInternal();
    } else {
      const remainingMs = FIVE_HOURS_MS - elapsed;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      currentQuota.cooldownRemainingMs = remainingMs;
      currentQuota.cooldownFormatted = `${hours}h ${minutes}m ${seconds}s`;
    }
  }

  if (userApiKey && userApiKey.trim().length > 0) {
    return {
      ...currentQuota,
      mode: 'user_key',
    };
  }

  return {
    ...currentQuota,
    mode: 'app_demo_key',
  };
}

export function canMakeAiRequest(userApiKey?: string): { allowed: boolean; reason?: string; keyToUse?: string } {
  if (userApiKey && userApiKey.trim().length > 0) {
    return { allowed: true, keyToUse: userApiKey.trim() };
  }

  const quota = getQuotaState();

  if (quota.requestsUsed >= quota.maxDemoRequests) {
    return {
      allowed: false,
      reason: `Demo Key Limit Reached (${quota.requestsUsed}/${quota.maxDemoRequests} requests max). Cooldown active (${quota.cooldownFormatted || '5 hours'}). Configure your own Gemini API key for unlimited AI generations.`
    };
  }

  return { allowed: true };
}

export function trackAiApiCall(tokensEstimate: number, userApiKey?: string) {
  currentQuota.requestsUsed += 1;
  currentQuota.totalTokensEstimated += Math.max(tokensEstimate, 150);
  currentQuota.lastCallTimestamp = new Date().toLocaleTimeString();

  if (!userApiKey && currentQuota.requestsUsed >= currentQuota.maxDemoRequests) {
    currentQuota.rateLimitStatus = 'quota_exceeded';
    if (!currentQuota.quotaExceededTimestamp) {
      currentQuota.quotaExceededTimestamp = Date.now();
    }
  } else {
    currentQuota.rateLimitStatus = 'ok';
  }
}

function resetDemoQuotaInternal() {
  currentQuota.requestsUsed = 0;
  currentQuota.totalTokensEstimated = 0;
  currentQuota.rateLimitStatus = 'ok';
  currentQuota.quotaExceededTimestamp = undefined;
  currentQuota.cooldownRemainingMs = undefined;
  currentQuota.cooldownFormatted = undefined;
}

/**
 * Reset Demo Quota - Only authorized for Admin / Owner
 */
export function resetDemoQuota() {
  resetDemoQuotaInternal();
}
