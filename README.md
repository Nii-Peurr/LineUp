# LineUp

LineUp is a production-oriented SaaS MVP for replacing physical lines with virtual queues. Customers join from their phone, receive live updates, and can buy Fast Pass. Businesses manage locations, queues, customers, wait times, and analytics. Super admins manage the platform.

## What Is Included

- Next.js App Router, TypeScript, TailwindCSS, and shadcn-style primitives.
- Customer portal with join, leave, position, people ahead, wait estimates, favorites, history, dark mode, SMS/email/push settings, and Fast Pass.
- Business dashboard with multi-location queues, call next, skip, served, remove, pause/resume, service-time controls, metrics, and AI insights.
- Super admin panel for businesses, users, subscriptions, revenue, Fast Pass settings, and platform analytics.
- API routes for queue management, Fast Pass, Stripe checkout/webhooks, notifications, AI wait prediction, and AI insights.
- Supabase PostgreSQL schema with RLS policies, seed data, indexes, payments, subscriptions, notifications, and AI insight tables.
- Demo in-memory data path so the app runs locally or on Vercel before credentials are configured.
- Vitest coverage for the queue engine and Fast Pass rules.

## Quick Start

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

PowerShell may block `npm.ps1` on Windows. Use `npm.cmd` as shown above.

## Public Demo Mode

LineUp is ready to deploy as a public Vercel demo without real provider keys.

When credentials are missing:

- Queue data uses the in-memory demo store seeded with Fade Masters sample data.
- Stripe plan upgrades and Fast Pass purchases return demo checkout URLs instead of calling Stripe.
- OpenAI wait prediction and business insights use deterministic demo responses.
- SMS, email, and push notifications return skipped provider results instead of sending messages.
- Supabase is optional; the demo pages and API routes use local seed data.
- Stripe webhooks acknowledge demo requests when Stripe credentials or signatures are missing.

This mode is intended for demos only. Data resets when the serverless runtime restarts, and demo queue state is not shared durable production data.

## Environment

For a Vercel public demo, no environment variables are required. You can deploy with the blank values from `.env.example` or omit them entirely.

For connected production mode, configure:

- Supabase URL, anon key, and service role key.
- Stripe secret key and webhook secret.
- OpenAI API key for AI predictions and business insights.
- Twilio credentials for SMS.
- Resend credentials for email.
- Firebase service account fields for push notifications.

## Database

Run `supabase/schema.sql` in Supabase SQL editor or through the Supabase CLI. Then run `supabase/seed.sql` for sample data.

Key tables:

- `profiles`
- `businesses`
- `business_memberships`
- `locations`
- `queues`
- `queue_entries`
- `favorite_businesses`
- `notification_events`
- `payments`
- `subscriptions`
- `ai_insights`

RLS is enabled across all tenant-owned data. Business members can manage their business data, customers can view/update their own queue entries, and admins can access platform data.

## Plans

- Starter: free, one location, 100 customers/month.
- Professional: $49/month, unlimited customers, SMS notifications, analytics.
- Enterprise: custom pricing, multiple locations, API access, white-label.

Stripe lookup keys are defined in `lib/plans.ts`.

## Fast Pass

Fast Pass modes:

- Disabled: no customer can buy priority.
- Limited: caps active Fast Pass usage in a queue.
- Unlimited: customers can buy priority whenever the queue allows it.

The queue engine never moves a Fast Pass customer ahead of a customer currently being served.

## Useful Commands

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test
npm.cmd run lint
```

## Deployment

Deploy a public demo to Vercel:

1. Import the repository into Vercel.
2. Use the Next.js framework preset.
3. Leave provider keys blank for demo mode.
4. Use the default Vercel install and build commands, or set build command to `npm run build`.
5. Open `/`, `/customer`, `/business`, `/admin`, and `/auth` on the generated Vercel URL.

Deploy connected production mode:

1. Create Supabase project and run the SQL files.
2. Configure OAuth providers in Supabase Auth: Google, Apple, and email magic links.
3. Create Stripe prices with lookup keys from `lib/plans.ts`.
4. Add production environment variables in Vercel.
5. Add Stripe webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`.
6. Configure Twilio, Resend, and Firebase credentials.
7. Run `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test`, and `npm.cmd run build` before promoting.

See `DEMO.md` for the barber shop demo script and public-demo verification checklist.

## Scale Notes

The MVP separates queue-domain rules from UI/API code, uses PostgreSQL/RLS for tenant isolation, and keeps external providers behind service adapters. For 1M users and 100K businesses, move queue mutation endpoints to transactional SQL/RPC functions or a worker-backed command queue, add realtime Supabase channels per queue, and stream notification jobs through a durable queue such as Inngest, Trigger.dev, or Cloud Tasks.
