/**
 * Webhook router — dispatches incoming Telnyx webhook events to the
 * appropriate handler based on `event_type` / `record_type`.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyTelnyxSignature } from './verify.js';
import { MessageReceivedPayloadSchema } from '../types.js';
import { forwardInboundMessage } from '../messaging/service.js';
import { clearFailover } from '../callcontrol/router.js';

export interface WebhookContext {
  recordType: string;
  eventType: string;
  payload: unknown;
}

/**
 * Middleware: verify Telnyx webhook signature.
 * Rejects requests that fail signature verification or are stale.
 */
export function webhookSignatureGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signatureHeader = req.headers['telnyx-signature'] as string | undefined;
  // Express raw body must be populated by the raw body middleware.
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

  if (!rawBody) {
    res.status(400).json({ error: 'Missing raw body' });
    return;
  }

  if (!verifyTelnyxSignature(rawBody, signatureHeader)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  next();
}

/**
 * Handler for `message.received` events.
 * Parses the payload, forwards to Django, and acknowledges.
 */
export async function handleMessageReceived(
  req: Request,
  res: Response
): Promise<void> {
  const payload = MessageReceivedPayloadSchema.parse(req.body.data.payload);

  const result = await forwardInboundMessage(payload);

  if (!result.success) {
    // Still acknowledge to Telnyx so they don't retry indefinitely;
    // the failure is logged and surfaced via the response body.
    res.status(202).json({
      acknowledged: true,
      forwarded: false,
      error: result.error,
    });
    return;
  }

  res.json({ acknowledged: true, forwarded: true, externalId: result.externalId });
}

/**
 * Handler for `call.answer` events — clears the failover timer
 * once the primary destination picks up.
 */
export async function handleCallAnswer(
  req: Request,
  res: Response
): Promise<void> {
  const callLegId = req.body?.data?.payload?.call_control_id as string | undefined;
  if (callLegId) clearFailover(callLegId);
  res.json({ acknowledged: true });
}

/**
 * Handler for `call.hangup` / voicemail recording completion events.
 * Forwards the recording to Django for voicemail storage + alert.
 */
export async function handleVoicemailComplete(
  req: Request,
  res: Response
): Promise<void> {
  const payload = req.body.data.payload as {
    call_leg_id?: string;
    from?: string;
    to?: string;
    duration?: number;
    recording_urls?: string[];
    voicemail_storage_bucket_id?: string;
  };

  const { forwardVoicemailAlert } = await import('../messaging/service.js');
  await forwardVoicemailAlert({
    call_id: payload.call_leg_id ?? '',
    from: payload.from ?? '',
    to: payload.to ?? '',
    duration_seconds: payload.duration ?? 0,
    recording_url: payload.recording_urls?.[0],
    voicemail_bucket: payload.voicemail_storage_bucket_id,
  });

  res.json({ acknowledged: true });
}