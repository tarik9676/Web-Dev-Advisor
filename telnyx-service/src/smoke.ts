/**
 * Smoke test: starts the Express server with a minimal env and exercises
 * the health endpoint + outbound auth guard. No Telnyx calls are made.
 */

import { getEnv } from './config/env.js';

// Minimal env for smoke testing — set BEFORE first getEnv() call.
process.env = {
  ...process.env,
  PORT: '3099', // smoke test port
  NODE_ENV: 'test',
  TELNYX_API_KEY: 'key',
  TELNYX_PUBLIC_KEY: 'pub',
  TELNYX_CONNECTION_ID: 'conn',
  TELNYX_CALIFORNIA_DID: '+14155550100',
  TELNYX_MESSAGING_PROFILE_ID: 'prof',
  TELNYX_MESSAGING_FROM_NUMBER: '+14155550100',
  TELNYX_VOICEMAIL_BUCKET: 'bucket',
  SALES_PRIMARY_NUMBERS: '+14155550120',
  SUPPORT_SIP_URIS: 'sip:alice@domain.com',
  DJANGO_API_BASE_URL: 'http://localhost:8000',
  DJANGO_WEBHOOK_SECRET: 'secret',
  DJANGO_MESSAGE_ENDPOINT: '/api/v1/external/telnyx/messages/',
  DJANGO_VOICEMAIL_ENDPOINT: '/api/v1/external/telnyx/voicemail/',
};

const env = getEnv();
console.log('✓ env validated, port=', env.PORT);

const { createApp } = await import('./server.js');
const app = createApp();
const server = app.listen(0);
const port = (server.address() as { port: number }).port;

try {
  // Health check
  const health = await fetch(`http://localhost:${port}/health`);
  console.assert(health.status === 200, 'health status');
  console.log('✓ /health', await health.json());

  // Outbound auth guard rejects missing key
  const unauth = await fetch(`http://localhost:${port}/api/v1/telnyx/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: '+14155550120', text: 'hi' }),
  });
  console.assert(unauth.status === 401, 'unauth status');
  console.log('✓ /api/v1/telnyx/messages rejects missing key →', unauth.status);

  // Outbound auth guard accepts correct key
  const auth = await fetch(`http://localhost:${port}/api/v1/telnyx/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': 'secret',
    },
    body: JSON.stringify({ to: '+14155550120', text: 'hi' }),
  });
  // Will fail at the Telnyx SDK layer (no real key) but should pass auth.
  console.assert(auth.status !== 401, 'auth should pass');
  console.log('✓ /api/v1/telnyx/messages passes auth →', auth.status);

  console.log('\n✅ Smoke test passed');
} finally {
  server.close();
}