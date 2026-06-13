# Architecture

LineUp is structured as a multi-tenant SaaS with four layers:

1. Product surfaces: customer portal, business dashboard, super admin.
2. API routes: auth, onboarding, business settings, queue mutations, payments, notifications, AI, directory data.
3. Domain services: queue engine, plans, provider adapters.
4. Data layer: Supabase PostgreSQL with RLS, with an in-memory demo fallback only when Supabase credentials are missing.

## Data Modes

`lib/data-store.ts` is the runtime data boundary. It uses Supabase when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured. If those variables are missing, it delegates to `lib/store.ts`, the seeded in-memory demo store.

Customer-ready MVP mode stores businesses, locations, queues, queue entries, profiles, memberships, staff, payments, and insights in Supabase. Demo mode is intentionally non-durable and exists for no-key public demos.

## Auth And Roles

Supabase Auth handles email/password signup and sign-in. LineUp stores the app role in `profiles.role`.

- `customer`: can use the customer queue flow.
- `business_owner`: can onboard a business, open `/business`, update settings, and manage queues for owned/member businesses.
- `staff`: can manage queues for member businesses.
- `admin`: can open `/admin` and manage platform data.

Business and admin pages are role-gated when Supabase is configured. Queue mutation APIs also check role and business membership for business-only actions.

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
- Add refresh-token rotation for long-lived business dashboard sessions.
- Add rate limits per IP, user, and business.
