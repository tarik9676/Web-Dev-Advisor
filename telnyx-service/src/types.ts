/**
 * Shared type definitions for the Telnyx service.
 * All Telnyx webhook payloads are validated against these at runtime.
 */

import { z } from 'zod';

/** E.164 phone number: + followed by 1–15 digits (no spaces/parens) */
export const E164Schema = z.string().regex(
  /^\+[1-9]\d{1,14}$/,
  'Must be E.164 format (e.g. +14155550100)'
);

export type E164 = z.infer<typeof E164Schema>;

/** A single messaging webhook event envelope from Telnyx */
export const TelnyxWebhookSchema = z.object({
  data: z.object({
    event_type: z.string(),
    id: z.string().optional(),
    record_type: z.string().optional(),
    payload: z.unknown(),
  }),
});

export type TelnyxWebhook = z.infer<typeof TelnyxWebhookSchema>;

/** message.received payload shape (subset we care about) */
export const MessageReceivedPayloadSchema = z.object({
  id: z.string(),
  direction: z.literal('inbound'),
  from: E164Schema,
  to: E164Schema,
  text: z.string(),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        content_type: z.string().optional(),
      })
    )
    .default([]),
  profile_id: z.string().optional(),
  messaging_profile_id: z.string().optional(),
  failed: z.boolean().optional(),
});

export type MessageReceivedPayload = z.infer<typeof MessageReceivedPayloadSchema>;

/** Outbound message request from our REST API */
export const OutboundMessageSchema = z.object({
  to: E164Schema,
  text: z.string().min(1).max(1600),
  media_urls: z.array(z.string().url()).optional().default([]),
});

export type OutboundMessage = z.infer<typeof OutboundMessageSchema>;

/** Voicemail alert payload forwarded to Django */
export const VoicemailAlertSchema = z.object({
  call_id: z.string(),
  from: E164Schema,
  to: E164Schema,
  duration_seconds: z.number().int().nonnegative().default(0),
  recording_url: z.string().url().optional(),
  voicemail_bucket: z.string().optional(),
  transcript: z.string().optional(),
});

export type VoicemailAlert = z.infer<typeof VoicemailAlertSchema>;

/** Call Control action result */
export const CallControlResponseSchema = z.object({
  call_id: z.string(),
  call_leg_id: z.string(),
  control_id: z.string(),
});

export type CallControlResponse = z.infer<typeof CallControlResponseSchema>;

/** DTMF menu option mapping */
export const DTMF_OPTIONS = {
  SALES: '1',
  SUPPORT: '2',
} as const;

export type DtmfOption = (typeof DTMF_OPTIONS)[keyof typeof DTMF_OPTIONS];