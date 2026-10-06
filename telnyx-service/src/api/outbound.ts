/**
 * Outbound REST API — allows authenticated agents to send SMS/MMS replies.
 *
 * POST /api/v1/telnyx/messages
 *   { "to": "+14155550120", "text": "Hello", "media_urls": [] }
 *
 * Authentication: Bearer token via `X-Api-Key` header (shared secret).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { OutboundMessageSchema } from '../types.js';
import { sendOutboundMessage } from '../messaging/service.js';
import { getEnv } from '../config/env.js';

export const outboundRouter = Router();

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const env = getEnv();
  const provided = req.headers['x-api-key'];
  if (provided !== env.DJANGO_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

outboundRouter.use(authenticate);

outboundRouter.post('/messages', async (req, res) => {
  const parse = OutboundMessageSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid request', details: parse.error.issues });
    return;
  }

  const result = await sendOutboundMessage(parse.data);
  if (!result.success) {
    res.status(502).json({ error: 'Upstream failure', detail: result.error });
    return;
  }

  res.json({ success: true, externalId: result.externalId });
});