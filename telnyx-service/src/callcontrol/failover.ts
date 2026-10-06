/**
 * Failover scheduler — when a primary destination does not answer within
 * the configured window, cascade the call to a backup number/URI.
 *
 * Implemented as a per-call-leg timer registry. When `call.answer` arrives
 * for the primary leg, the timer is cleared. If it fires, we issue a
 * transfer to the fallback destination.
 */

import { getTelnyxClient } from '../telnyx/client.js';
import { getEnv } from '../config/env.js';

interface PendingFailover {
  callLegId: string;
  fallbackDestination: string;
  timer: NodeJS.Timeout;
}

const registry = new Map<string, PendingFailover>();

/**
 * Register a failover timer for a call leg.
 * If the timer fires before `clearFailover` is called, the call is
 * transferred to the fallback destination.
 */
export function scheduleFailover(
  callLegId: string,
  fallbackDestination: string
): void {
  // Clear any existing timer for this leg.
  clearFailover(callLegId);

  const env = getEnv();
  const timer = setTimeout(async () => {
    registry.delete(callLegId);
    try {
      const telnyx = getTelnyxClient();
      await telnyx.calls.actions.transfer(callLegId, {
        to: fallbackDestination,
      });
      console.log(`[failover] Cascaded call ${callLegId} → ${fallbackDestination}`);
    } catch (err) {
      console.error(`[failover] Failed to cascade call ${callLegId}:`, err);
    }
  }, env.FAILOVER_TIMEOUT_SECONDS * 1000);

  registry.set(callLegId, { callLegId, fallbackDestination, timer });
}

/**
 * Cancel the failover timer for a call leg (e.g. when the primary answers).
 */
export function clearFailover(callLegId: string): void {
  const existing = registry.get(callLegId);
  if (existing) {
    clearTimeout(existing.timer);
    registry.delete(callLegId);
  }
}

/**
 * Cancel all pending failover timers (used on graceful shutdown).
 */
export function clearAllFailovers(): void {
  for (const entry of registry.values()) {
    clearTimeout(entry.timer);
  }
  registry.clear();
}