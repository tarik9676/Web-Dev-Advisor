# Web Dev Advisor LLC — Telnyx Voice & Messaging Service

Standalone Node.js/TypeScript service that handles Telnyx Programmable Voice
and Messaging webhooks for **Web Dev Advisor LLC**.

## Features

- **Inbound IVR** — automated receptionist greeting with DTMF menu routing
  (`1` → US Sales agents, `2` → international Support via SIP softphone).
- **15-second failover** — cascades to a backup number/URI if the primary
  does not answer.
- **Voicemail** — forwards unanswered calls to a Telnyx storage bucket and
  alerts Django (which triggers a SendGrid email).
- **Two-way SMS/MMS** — inbound webhook forwards to Django for persistence
  + React chat UI; outbound REST endpoint lets agents reply via Telnyx.
- **Security** — Ed25519 JWS signature verification on every webhook;
  stale deliveries (>5 min) are rejected.
- **Cross-border E.164** — strict E.164 validation on all phone numbers.

## Layout

```
telnyx-service/
├── src/
│   ├── config/env.ts          # Zod-validated env schema
│   ├── telnyx/client.ts       # Telnyx SDK singleton
│   ├── callcontrol/
│   │   ├── router.ts          # IVR routing + bridge/transfer/gather
│   │   └── failover.ts        # Per-leg failover timer registry
│   ├── messaging/
│   │   └── service.ts         # Inbound forward + outbound send
│   ├── webhooks/
│   │   ├── verify.ts          # JWS signature verification
│   │   └── router.ts          # Webhook dispatch (message/call/voicemail)
│   ├── api/
│   │   └── outbound.ts        # Agent reply REST endpoint
│   └── server.ts              # Express entrypoint
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json              # Strict TypeScript
```

## Quick start

```bash
cd telnyx-service
cp .env.example .env            # fill in real Telnyx / Django values
npm install
npm run dev                    # http://localhost:3000
```

## Webhook endpoints

| Method | Path                              | Purpose                              |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/webhooks/telnyx/messaging`     | Inbound `message.received` → Django  |
| POST   | `/webhooks/telnyx/callcontrol`   | `call.answer`, `call.hangup`, etc.    |
| POST   | `/api/v1/telnyx/messages`        | Agent outbound SMS/MMS (auth required) |
| GET    | `/health`                         | Liveness probe                       |

## Telnyx portal setup

1. Create an API Key at `https://portal.telnyx.com` → API Keys.
2. Copy the **Public Key** (Ed25519) for webhook signature verification.
3. Create a **Connection** (SIP trunk) and note its ID.
4. Order a California DID (e.g. `+14155550100`) and link it to the connection.
5. Create a **Messaging Profile** and note its ID.
6. Create a **Voicemail Storage Bucket** and note its ID.
7. Configure webhook URLs on the connection / messaging profile to point at
   this service (e.g. `https://your-domain.com/webhooks/telnyx/...`).

## Docker

```bash
docker compose --project-directory . up -d
```