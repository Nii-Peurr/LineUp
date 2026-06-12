# Deployment

## Vercel

1. Create a Vercel project from this repository.
2. Set the framework preset to Next.js.
3. Add environment variables from `.env.example`.
4. Set build command to `npm.cmd run build` on Windows or `npm run build` on hosted Linux.
5. Set output to the default Next.js output.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql` for sample data.
4. Enable Google, Apple, and email magic link auth providers.
5. Add production redirect URLs for Vercel.

## Stripe

1. Create products for Professional and Enterprise.
2. Add recurring monthly prices.
3. Set lookup keys:
   - `lineup_professional_monthly`
   - `lineup_enterprise_monthly`
4. Add webhook endpoint: `https://YOUR_DOMAIN/api/stripe/webhook`.
5. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Twilio

Add verified sender number and configure:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

## Firebase

Create a Firebase project with Cloud Messaging enabled. Store device tokens in a production `push_tokens` table before sending push notifications.

## OpenAI

Set `OPENAI_API_KEY`. The app defaults to `gpt-5-mini` for wait predictions and insights. You can override models with `OPENAI_WAIT_MODEL` and `OPENAI_INSIGHTS_MODEL`.
