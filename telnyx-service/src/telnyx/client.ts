/**
 * Thin wrapper around the official Telnyx Node SDK.
 * Centralises client initialisation so we can mock it in tests.
 */

import Telnyx, { type ClientOptions } from 'telnyx';
import { getEnv } from '../config/env.js';

let client: Telnyx | null = null;

export function getTelnyxClient(): Telnyx {
  if (client) return client;
  const env = getEnv();
  const opts: ClientOptions = {
    apiKey: env.TELNYX_API_KEY,
    // Disables the SDK's default request timeout so our own
    // failover timers control call-control latency.
    timeout: 0,
  };
  client = new Telnyx(opts);
  return client;
}