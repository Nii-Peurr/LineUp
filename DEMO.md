# LineUp Public Demo Runbook

Use this checklist to deploy and present LineUp as a public Vercel demo without real API keys.

## Demo Mode Guarantee

LineUp runs without Supabase, Stripe, OpenAI, Twilio, Resend, or Firebase credentials.

Missing provider behavior:

- Queue data: seeded in-memory demo data.
- Stripe subscriptions and Fast Pass: demo checkout URLs.
- OpenAI wait prediction and insights: deterministic demo responses.
- SMS, email, and push notifications: skipped provider results.
- Supabase: optional for the demo path.
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
- `/auth` authentication demo screen

## Phone Demo Script

1. Open the Vercel URL on the phone.
2. Tap `Join Queue`.
3. Confirm the position, people ahead, and wait estimate update.
4. Tap `Fast Pass` and confirm the customer moves closer to the front.
5. Tap `Leave` and confirm the page shows `Not in queue`.
6. Open `Business` from mobile navigation.
7. Call next, skip, or mark served from the business dashboard.
8. Open `Admin` and show responsive business cards plus system analytics.

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
