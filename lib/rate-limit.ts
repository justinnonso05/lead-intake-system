import { LRUCache } from 'lru-cache';

type RateLimitContext = {
  tokenCount: number; // requests remaining
  lastReset: number; // timestamp
};

// 5 requests per 60 seconds
const LIMIT = 5;
const WINDOW_MS = 60 * 1000;

const tokenCache = new LRUCache<string, RateLimitContext>({
  max: 500,
  ttl: WINDOW_MS,
});

export function checkRateLimit(identifier: string) {
  const now = Date.now();
  const currentToken = tokenCache.get(identifier);

  if (!currentToken) {
    // First request
    tokenCache.set(identifier, {
      tokenCount: LIMIT - 1,
      lastReset: now,
    });
    return { success: true, remaining: LIMIT - 1 };
  }

  if (currentToken.tokenCount > 0) {
    tokenCache.set(identifier, {
      ...currentToken,
      tokenCount: currentToken.tokenCount - 1,
    });
    return { success: true, remaining: currentToken.tokenCount - 1 };
  }

  // Blocked
  return { success: false, remaining: 0 };
}
