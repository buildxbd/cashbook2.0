interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate-limiter store
const rateLimitStore = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();

function cleanupStaleRecords(now: number) {
  if (now - lastCleanup > 60000) {
    lastCleanup = now;
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    });
  }
}

/**
 * Checks whether an incoming request exceeds the configured threshold
 * @param identifier Client IP, API Token, or unique identifier
 * @param limit Maximum allowed requests within the time window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  cleanupStaleRecords(now);
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetAt,
  };
}
