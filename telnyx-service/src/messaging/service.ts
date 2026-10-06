/**
 * Outbound messaging service — sends SMS/MMS via the Telnyx Messaging API
 * and forwards inbound messages to the Django backend for persistence.
 */

import { getTelnyxClient } from '../telnyx/client.js';
import { getEnv } from '../config/env.js';
import type {
  MessageReceivedPayload,
  OutboundMessage,
  VoicemailAlert,
} from '../types.js';

export interface ForwardResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

/**
 * Forward an inbound Telnyx message to Django for database persistence
 * and to update the React team chat UI in real time.
 */
export async function forwardInboundMessage(
  payload: MessageReceivedPayload
): Promise<ForwardResult> {
  const env = getEnv();
  const url = `${env.DJANGO_API_BASE_URL.replace(/\/$/, '')}${env.DJANGO_MESSAGE_ENDPOINT}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.DJANGO_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        telnyx_message_id: payload.id,
        from: payload.from,
        to: payload.to,
        text: payload.text,
        media: payload.media,
        messaging_profile_id: payload.messaging_profile_id ?? payload.profile_id,
        received_at: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Django returned ${response.status}`,
      };
    }

    const body = (await response.json()) as { external_id?: string };
    return { success: true, externalId: body.external_id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send an outbound SMS/MMS via Telnyx.
 */
export async function sendOutboundMessage(
  message: OutboundMessage
): Promise<ForwardResult> {
  const telnyx = getTelnyxClient();
  const env = getEnv();

  try {
    const response = await telnyx.messages.send({
      messaging_profile_id: env.TELNYX_MESSAGING_PROFILE_ID,
      to: message.to,
      from: env.TELNYX_MESSAGING_FROM_NUMBER,
      text: message.text,
      media_urls: message.media_urls,
    });

    return { success: true, externalId: response.data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Forward a voicemail alert to Django (storage bucket + email alert).
 */
export async function forwardVoicemailAlert(
  alert: VoicemailAlert
): Promise<ForwardResult> {
  const env = getEnv();
  const url = `${env.DJANGO_API_BASE_URL.replace(/\/$/, '')}${env.DJANGO_VOICEMAIL_ENDPOINT}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.DJANGO_WEBHOOK_SECRET,
      },
      body: JSON.stringify(alert),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { success: false, error: `Django returned ${response.status}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}