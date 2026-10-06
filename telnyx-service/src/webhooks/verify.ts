/**
 * Telnyx webhook signature verification.
 *
 * Telnyx signs every webhook with a JSON Web Signature (JWS) using the
 * Ed25519 algorithm. The `telnyx-signature` header contains a timestamp
 * and a signature. We verify it against the Telnyx public key to prevent
 * spoofed webhook delivery.
 *
 * Reference: https://developer.telnyx.com/docs/programmable-voice/webhooks
 */

import crypto from 'node:crypto';
import { getEnv } from '../config/env.js';

export interface SignatureHeader {
  timestamp: string;
  signature: string;
}

/**
 * Parse the `telnyx-signature` header into its component parts.
 * Format: t=<timestamp>,v1=<signature>
 */
export function parseSignatureHeader(
  header: string | undefined
): SignatureHeader | null {
  if (!header) return null;
  const parts = header.split(',');
  let timestamp = '';
  let signature = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    else if (key === 'v1') signature = value;
  }
  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

/**
 * Verify a Telnyx webhook signature using the configured public key.
 *
 * The signature is computed over `timestamp.body` (raw bytes) using the
 * Ed25519 public key. Returns true only when the signature is valid AND
 * the timestamp is within the allowed tolerance window.
 */
export function verifyTelnyxSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  toleranceSeconds = 300
): boolean {
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const { timestamp, signature } = parsed;

  // Reject stale deliveries to prevent replay attacks.
  const deliveryTime = Date.parse(timestamp);
  if (Number.isNaN(deliveryTime)) return false;
  const ageMs = Date.now() - deliveryTime;
  if (Math.abs(ageMs) > toleranceSeconds * 1000) return false;

  const env = getEnv();
  const publicKeyPem = env.TELNYX_PUBLIC_KEY;

  // Telnyx signs the raw payload bytes concatenated with the timestamp.
  const signedPayload = Buffer.concat([
    Buffer.from(timestamp, 'utf8'),
    Buffer.from('.'),
    rawBody,
  ]);

  try {
    const verifier = crypto.createVerify(
      'Ed25519'
    );
    // The public key may be provided as PEM or raw base64.
    const key = publicKeyPem.includes('BEGIN')
      ? publicKeyPem
      : Buffer.from(publicKeyPem, 'base64').toString('utf8');

    return verifier.update(signedPayload).verify(key, signature, 'base64');
  } catch {
    return false;
  }
}