/**
 * Call Control routing engine.
 *
 * Implements the inbound IVR flow for Web Dev Advisor LLC:
 *   1. Incoming call → automated receptionist greeting (gather DTMF)
 *   2. DTMF KeyPress 1 → bridge to US-based Sales agents
 *   3. DTMF KeyPress 2 → bridge to international Support agents via SIP
 *   4. Timeout / no input → voicemail storage + email alert
 *
 * Every outbound bridge includes a 15-second failover timer that
 * cascades to a backup destination when the primary does not answer.
 */

import { getTelnyxClient } from '../telnyx/client.js';
import { getEnv } from '../config/env.js';
import { scheduleFailover, clearFailover } from './failover.js';
import type { DtmfOption, E164 } from '../types.js';

export interface RouteCallInput {
  callLegId: string;
  destination: string; // E.164 number or sip: URI
  fallbackDestination: string;
}

/**
 * Bridge an inbound call leg to a destination (phone or SIP URI).
 * Schedules an automatic failover if the primary does not pick up.
 */
export async function bridgeWithFailover(
  input: RouteCallInput
): Promise<{ callLegId: string }> {
  const telnyx = getTelnyxClient();

  await telnyx.calls.actions.bridge(input.callLegId, {
    call_control_id: input.callLegId,
    // Attach metadata so downstream webhooks can identify the branch.
    client_state: Buffer.from(
      JSON.stringify({
        branch: 'primary',
        destination: input.destination,
        fallback: input.fallbackDestination,
      })
    ).toString('base64'),
  });

  // Schedule failover — cleared when `call.answer` arrives for this leg.
  scheduleFailover(input.callLegId, input.fallbackDestination);

  return { callLegId: input.callLegId };
}

/**
 * Forward a call to Telnyx voicemail storage.
 */
export async function forwardToVoicemail(callLegId: string): Promise<void> {
  const telnyx = getTelnyxClient();
  const env = getEnv();

  await telnyx.calls.actions.transfer(callLegId, {
    to: env.TELNYX_VOICEMAIL_BUCKET,
    // Request a recording of the greeting left by the caller.
    record: 'record-from-answer',
  });
}

/**
 * Play the IVR greeting and collect DTMF input.
 * Telnyx will send a `call.gather.ended` webhook when the caller presses a key
 * or the timeout expires.
 */
export async function playIvrGreeting(
  callLegId: string
): Promise<{ callLegId: string }> {
  const telnyx = getTelnyxClient();
  await telnyx.calls.actions.gatherUsingAudio(callLegId, {
    // Play the greeting while gathering DTMF.
    audio_url: 'https://cdn.webdevadvisor.io/ivr/greeting.mp3',
    // Wait up to 15 seconds for the first digit.
    timeout_millis: 15_000,
    // Accept a single digit.
    maximum_digits: 1,
    minimum_digits: 1,
    // Valid menu options.
    valid_digits: '0123456789*#',
  });
  return { callLegId };
}

/**
 * Route a call based on the DTMF option pressed.
 * Returns the bridged call leg id, or null if the option is unrecognised
 * (caller should be sent to voicemail).
 */
export async function routeByDtmf(
  callLegId: string,
  digit: string
): Promise<{ callLegId: string } | null> {
  const env = getEnv();

  switch (digit as DtmfOption) {
    case '1': {
      // Sales → US-based agents (phone numbers), with failover.
      const [primary, ...fallbacks] = env.SALES_PRIMARY_NUMBERS;
      return bridgeWithFailover({
        callLegId,
        destination: primary,
        fallbackDestination: fallbacks[0] ?? primary,
      });
    }
    case '2': {
      // Support → international agents via SIP softphone.
      const [primary, ...fallbacks] = env.SUPPORT_SIP_URIS;
      return bridgeWithFailover({
        callLegId,
        destination: primary,
        fallbackDestination: fallbacks[0] ?? primary,
      });
    }
    default:
      return null;
  }
}

/**
 * Format an E.164 string for Telnyx (already E.164, but this normalises
 * by stripping whitespace — useful for cross-border input).
 */
export function normaliseE164(input: string): E164 {
  const cleaned = input.replace(/[\s\-()]/g, '');
  if (!cleaned.startsWith('+')) {
    throw new Error(`Invalid E.164 format: ${input}`);
  }
  return cleaned as E164;
}

/** Re-export for webhook router to clear timers on answer/hangup. */
export { clearFailover };