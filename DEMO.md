# LineUp Public Demo Runbook

Use this checklist to deploy and present LineUp either as a public no-key demo or as a customer-ready MVP with saved Supabase data.

## Customer-Ready MVP Checklist

For a real barber shop demo with saved data, configure these Vercel environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then:

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Optionally run `supabase/seed.sql` for sample data.
3. Enable email/password sign-in in Supabase Auth.
4. Open `/auth`.
5. Choose `Owner`.
6. Enter owner, business, location, queue, service time, and Fast Pass settings.
7. Create the business.
8. Confirm `/business` shows the saved queue and settings.
9. Join the saved queue from `/` or `/customer`.
10. Use the business dashboard to call next, pause/resume, and update settings.

## Demo Mode Guarantee

LineUp runs in no-key demo mode when Supabase credentials are missing. Optional providers can also be omitted in MVP mode.

Missing provider behavior:

- Supabase missing: seeded in-memory demo data.
- Stripe subscriptions and Fast Pass: demo checkout URLs.
- OpenAI wait prediction and insights: deterministic demo responses.
- SMS, email, and push notifications: skipped provider results.
- Stripe webhook: acknowledges demo requests when credentials are absent.

Demo data is not durable. Vercel serverless instances can reset state between cold starts or deployments.

## Vercel Demo Deployment

1. Import the repository into Vercel.
2. Keep the framework preset as Next.js.
3. Leave provider environment variables blank for demo mode.
4. Do not set `assetPrefix`, `basePath`, or localhost-only app URLs.
5. Build with `npm run build`.
6. Visit the generated Vercel domain.

Useful demo routes:

- `/` customer landing and queue experience
- `/customer` customer portal alias
- `/business` business dashboard
- `/admin` super admin dashboard
- `/auth` signup, sign-in, and business onboarding

## Phone Demo Script

1. Open `/auth` on the phone.
2. Create an owner account and business queue.
3. Open the generated business dashboard.
4. Confirm business name, location, queue name, service time, and Fast Pass settings are saved.
5. Open `/customer`.
6. Tap `Join Queue`.
7. Confirm the position, people ahead, and wait estimate update.
8. Tap `Fast Pass` and confirm the customer moves closer to the front.
9. Tap `Leave` and confirm the page shows `Not in queue`.
10. Open `Business` from mobile navigation.
11. Call next, skip, or mark served from the business dashboard.
12. Open `Admin` as an admin user and show responsive business cards plus system analytics.

## No-Key API Checks

These routes should respond without real provider keys:

- `POST /api/queues/queue_greenbelt_walkins/join`
- `POST /api/queue-entries/{entryId}/fast-pass`
- `POST /api/ai/wait-time`
- `POST /api/ai/insights`
- `POST /api/stripe/checkout`
- `POST /api/stripe/webhook`

Expected signs of demo mode:

- Fast Pass returns a relative demo checkout URL.
- AI wait prediction returns `source: "deterministic-demo"`.
- AI insights return seeded demo insight IDs.
- Notification responses are skipped rather than sent when provider keys are missing.

## Pre-Deploy Verification

Run these before sharing the public demo URL:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

On hosted Linux CI or Vercel, use `npm run ...` instead of `npm.cmd run ...`.
