/**
 * Environment configuration with runtime validation via Zod.
 * Fails fast on startup if required variables are missing/invalid.
 */

import { config } from 'dotenv';
import { z } from 'zod';

config();

const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  HOST: z.string().default('0.0.0.0'),

  // Telnyx
  TELNYX_API_KEY: z.string().min(1),
  TELNYX_PUBLIC_KEY: z.string().min(1),
  TELNYX_CONNECTION_ID: z.string().min(1),
  TELNYX_CALIFORNIA_DID: z.string().regex(/^\+[1-9]\d{1,14}$/),
  TELNYX_MESSAGING_PROFILE_ID: z.string().min(1),
  TELNYX_MESSAGING_FROM_NUMBER: z.string().regex(/^\+[1-9]\d{1,14}$/),
  TELNYX_VOICEMAIL_BUCKET: z.string().min(1),

  // Forwarding targets
  SALES_PRIMARY_NUMBERS: z
    .string()
    .transform((s) => s.split(',').map((n) => n.trim()))
    .pipe(z.array(z.string().regex(/^\+[1-9]\d{1,14}$/))),
  SUPPORT_SIP_URIS: z
    .string()
    .transform((s) => s.split(',').map((u) => u.trim()))
    .pipe(z.array(z.string().startsWith('sip:'))),

  // Failover
  FAILOVER_TIMEOUT_SECONDS: z.coerce.number().int().min(1).default(15),

  // Django forwarding
  DJANGO_API_BASE_URL: z.string().url(),
  DJANGO_WEBHOOK_SECRET: z.string().min(1),
  DJANGO_MESSAGE_ENDPOINT: z.string().min(1),
  DJANGO_VOICEMAIL_ENDPOINT: z.string().min(1),

  // Email alerts (optional — SendGrid fallback)
  SENDGRID_API_KEY: z.string().optional(),
  VOICEMAIL_ALERT_FROM: z.string().email().optional(),
  VOICEMAIL_ALERT_TO: z.string().email().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.issues);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}