/**
 * Application Feature Flags Configuration
 * Control feature rollout and sandbox/live toggle behavior.
 */

export const FEATURE_FLAGS = {
  /**
   * Set to true to route UPI requests to real banking APIs / gateways.
   * Defaults to false (uses MockPaymentAdapter).
   */
  ENABLE_LIVE_UPI: process.env.NEXT_PUBLIC_ENABLE_LIVE_UPI === 'true',
} as const;

/**
 * Checks whether live UPI banking engine is active.
 * @returns boolean
 */
export function isLiveUPIEnabled(): boolean {
  return FEATURE_FLAGS.ENABLE_LIVE_UPI;
}

/**
 * Returns current payment engine mode ('LIVE' | 'MOCK_ADAPTER')
 */
export function getPaymentEngineMode(): 'LIVE' | 'MOCK_ADAPTER' {
  return isLiveUPIEnabled() ? 'LIVE' : 'MOCK_ADAPTER';
}
