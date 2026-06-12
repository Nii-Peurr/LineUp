# Architecture

LineUp is structured as a multi-tenant SaaS with four layers:

1. Product surfaces: customer portal, business dashboard, super admin.
2. API routes: queue mutations, payments, notifications, AI, directory data.
3. Domain services: queue engine, plans, provider adapters.
4. Data layer: Supabase PostgreSQL with RLS.

## Queue Flow

Customers join a queue through `/api/queues/[queueId]/join`. Queue entries store customer contact channels, position, quoted wait, party size, and status. Businesses mutate entries through call-next, served, skipped, or removed actions.

Fast Pass is handled through `/api/queue-entries/[entryId]/fast-pass`. In demo mode the queue is promoted immediately. In production, Stripe Checkout completes first, then the webhook applies the Fast Pass mutation.

## AI

`/api/ai/wait-time` estimates wait using queue length, average service time, active staff, demand, and missed-turn rate. If `OPENAI_API_KEY` is missing, the deterministic model is used.

`/api/ai/insights` generates short operational insights for the business dashboard.

## Notifications

The notification adapter fans out to:

- Firebase push
- Twilio SMS
- Resend email

The demo path reports skipped providers when credentials are missing.

## Production Hardening

- Move queue mutations into Postgres functions with row locks.
- Add Supabase Realtime channels for active queues.
- Persist notification jobs in `notification_events` before provider calls.
- Add idempotency keys for Stripe webhooks and queue mutations.
- Add role-gated middleware for `/business` and `/admin`.
- Add rate limits per IP, user, and business.
