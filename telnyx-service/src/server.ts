/**
 * Express server entrypoint.
 *
 * Wires together:
 *   - Webhook signature verification
 *   - Messaging webhook router (inbound SMS/MMS)
 *   - Outbound REST API (agent replies)
 *   - Call Control webhook router (IVR DTMF, answer, hangup, voicemail)
 *   - Health check endpoint
 */

import express from 'express';
import { getEnv } from './config/env.js';
import { webhookSignatureGuard } from './webhooks/router.js';
import { outboundRouter } from './api/outbound.js';
import { clearAllFailovers } from './callcontrol/failover.js';

export function createApp() {
  const app = express();
  const env = getEnv();

  // Preserve raw body for signature verification.
  app.use(
    express.json({
      verify: (req, res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

  // --- Health check ---
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  // --- Inbound messaging webhook ---
  // Telnyx POSTs `message.received` here.
  app.post(
    '/webhooks/telnyx/messaging',
    webhookSignatureGuard,
    async (req, res) => {
      const { handleMessageReceived } = await import('./webhooks/router.js');
      await handleMessageReceived(req, res);
    }
  );

  // --- Call Control webhooks ---
  // These receive `call.answer`, `call.hangup`, `call.gather.ended`, etc.
  app.post(
    '/webhooks/telnyx/callcontrol',
    webhookSignatureGuard,
    async (req, res) => {
      const { handleCallAnswer, handleVoicemailComplete } = await import(
        './webhooks/router.js'
      );
      const eventType = req.body?.data?.event_type;

      if (eventType === 'call.answer') {
        await handleCallAnswer(req, res);
      } else if (eventType === 'call.hangup') {
        await handleVoicemailComplete(req, res);
      } else {
        res.json({ acknowledged: true });
      }
    }
  );

  // --- Outbound REST API (agent replies) ---
  app.use('/api/v1/telnyx', outboundRouter);

  return app;
}

/**
 * Start the HTTP server. Returns the running server so callers (including
 * tests) can close it gracefully.
 */
export function startServer(): ReturnType<typeof app.listen> {
  const app = createApp();
  const env = getEnv();
  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`🚀 Telnyx service listening on ${env.HOST}:${env.PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    clearAllFailovers();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  return server;
}

// ESM entrypoint: start the server when this module is the main file.
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}