export interface QuotaState {
  mode: 'user_key' | 'app_demo_key';
  requestsUsed: number;
  maxDemoRequests: number;
  totalTokensEstimated: number;
  rateLimitStatus: 'ok' | 'throttled' | 'quota_exceeded';
  lastCallTimestamp?: string;
}

// Global in-memory quota state
let currentQuota: QuotaState = {
  mode: 'app_demo_key',
  requestsUsed: 0,
  maxDemoRequests: 3,
  totalTokensEstimated: 0,
  rateLimitStatus: 'ok'
};

export function getQuotaState(userApiKey?: string): QuotaState {
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
  // If user provided their own key, unlimited
  if (userApiKey && userApiKey.trim().length > 0) {
    return { allowed: true, keyToUse: userApiKey.trim() };
  }

  // App Demo key mode capped at 3 requests
  if (currentQuota.requestsUsed >= currentQuota.maxDemoRequests) {
    return {
      allowed: false,
      reason: `Demo Key Limit Reached (${currentQuota.requestsUsed}/${currentQuota.maxDemoRequests} requests). Configure your own Gemini API key for unlimited AI generations.`
    };
  }

  return { allowed: true };
}

export function trackAiApiCall(tokensEstimate: number, userApiKey?: string) {
  currentQuota.requestsUsed += 1;
  currentQuota.totalTokensEstimated += Math.max(tokensEstimate, 150);
  currentQuota.lastCallTimestamp = new Date().toLocaleTimeString();

  if (currentQuota.mode === 'app_demo_key' && currentQuota.requestsUsed >= currentQuota.maxDemoRequests) {
    currentQuota.rateLimitStatus = 'quota_exceeded';
  } else {
    currentQuota.rateLimitStatus = 'ok';
  }
}

export function resetDemoQuota() {
  currentQuota.requestsUsed = 0;
  currentQuota.totalTokensEstimated = 0;
  currentQuota.rateLimitStatus = 'ok';
}
