/**
 * Application Feature Flags Configuration
 * Control feature rollout and sandbox/live toggle behavior.
 */

export const FEATURE_FLAGS = {
  /**
   * Set to true to route payment requests to live banking APIs / gateways.
   * Defaults to false (uses MockPaymentAdapter).
   */
  ENABLE_LIVE_UPI:
    process.env.NEXT_PUBLIC_ENABLE_LIVE_UPI === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_LIVE_PAYMENT === 'true',
  ENABLE_LIVE_PAYMENT:
    process.env.NEXT_PUBLIC_ENABLE_LIVE_PAYMENT === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_LIVE_UPI === 'true',
} as const;

/**
 * Checks whether live UPI/Payment banking engine is active.
 * Defaults cleanly to false.
 */
export function isLiveUPIEnabled(): boolean {
  return FEATURE_FLAGS.ENABLE_LIVE_UPI || FEATURE_FLAGS.ENABLE_LIVE_PAYMENT;
}

/**
 * Returns current payment engine mode ('LIVE' | 'MOCK_ADAPTER')
 */
export function getPaymentEngineMode(): 'LIVE' | 'MOCK_ADAPTER' {
  return isLiveUPIEnabled() ? 'LIVE' : 'MOCK_ADAPTER';
}
