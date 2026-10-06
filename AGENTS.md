# AGENTS.md

This project is a WooCommerce delivery planning workspace called **Web Dev Advisor**.

## Project Structure

- `backend/` - Django REST API backend
- `frontend/` - React/Vite frontend
- `docker-compose.yml` - Docker Compose configuration
- `Dockerfile.backend` - Backend Docker build
- `Dockerfile.frontend` - Frontend Docker build
- `nginx.conf` - Nginx configuration for production

## Backend

- Django 4.2 with REST Framework
- SQLite for local dev, PostgreSQL/MySQL via DATABASE_URL
- `planning` app split into domain apps under `backend/`:
  - `accounts` (auth: register/login/logout/me, exception handler)
  - `projects` (Project, ProjectInvoice, TeamMember)
  - `workstreams` (Workstream, Task, Milestone)
  - `governance` (ApprovalGate, Risk, DecisionLog)
  - `products` (ProductCategory, Product, ProductLicense, ProductDownload — public catalog, checkout, webhooks)
- Seed command: `python manage.py seed_demo_project` (also creates demo login `demo` / `demo-pass-2026`)
- Tests: `python manage.py test`
- Migrations: `python manage.py migrate`
- Session auth at `/api/auth/register|login|logout|me/`; delivery planning endpoints require a logged-in user who is a member of the project. Product catalog, checkout, and webhooks stay public.
- Session cookies need `CSRF_TRUSTED_ORIGINS` to cover the frontend origin; it defaults to `CORS_ALLOWED_ORIGINS`

## Billing

Client payments run through **staff-issued invoices**, one project to many installments.

- `ProjectInvoice` (`backend/projects/models.py`) — `project` FK, optional `milestone` FK so finance reads in delivery terms, `amount`/`currency`, `status` (draft / sent / paid / overdue / void), `due_date`, `client_email`, Stripe ids, `paid_at`
- Endpoints at `/api/projects/{id}/invoices/` plus `…/send/` and `…/void/`. Write actions are staff-only; clients see only invoices that left `draft`
- `GET /api/projects/{id}/billing_summary/` is staff-only and returns budget, invoiced, paid, outstanding
- **Paid status is webhook-only.** `backend/projects/stripe_billing.py` flips it from `checkout.session.completed` or `payment_intent.succeeded`, routed through the existing `/api/webhooks/stripe/` endpoint. `perform_update` rejects `status: "paid"` outright. Voiding is the one status a human sets by hand
- Money config: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_APP_URL`. Without the first two, `send` and the webhook return 503
- `Project.budget` is stripped from every representation for non-staff members — see `redact_budget()` in `backend/projects/serializers.py`. Do not reintroduce it on a new serializer
- Staff UI lives at `/app/billing` (behind `RequireStaff`), API client at `frontend/src/api/invoices.js`

## Frontend

- React 18 + Vite + React Router
- Dark theme UI with lucide-react icons
- API client at `src/api/client.js`
- Context: `src/context/AppContext.jsx`
- Auth context: `src/context/AuthContext.jsx` (session cookie, `src/api/client.js` sends `X-CSRFToken` on unsafe requests)
- Public pages: Home, Services, Pricing, About, Case Studies, Contact
- App pages: Dashboard, Plan, Tasks, Approvals, Risks, Knowledge
- Staff pages: Projects `/app/projects`, Invoices `/app/billing` (both behind `RequireStaff`)
- Auth pages: Sign in `/login`, Create account `/signup` (both `/app/*` routes sit behind `RequireAuth`)

## Key Conventions

- Humans own outcomes; AI produces bounded deliverables
- Every workstream has a human owner (AI cannot own)
- Every task has a human assignee and human reviewer
- Client-facing, financial, security, production, and scope decisions require human approval
- Status vocabulary: not_started, blocked, in_progress, internal_review, client_review, approved, done
- Priority: low, medium, high, critical
- Money state changes only from a verified Stripe webhook, never from a client action

## Commands

```bash
# Backend
cd backend
python manage.py runserver
python manage.py test
python manage.py seed_demo_project

# Frontend
cd frontend
npm run dev
npm run build
npm run lint

# Docker
docker-compose up -d