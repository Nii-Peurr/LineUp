# API

## Auth And Onboarding

`POST /api/auth/sign-up`

Creates a customer account or business owner account. Business owner signup can also create the first business, location, and queue.

```json
{
  "fullName": "Avery Brooks",
  "email": "owner@example.com",
  "password": "minimum8",
  "phone": "+12025550100",
  "role": "business_owner",
  "business": {
    "businessName": "Fade Masters",
    "locationName": "Greenbelt",
    "locationAddress": "7500 Greenway Center Dr, Greenbelt, MD",
    "queueName": "Walk-ins",
    "averageServiceMinutes": 16,
    "fastPassEnabled": true,
    "fastPassPriceCents": 1200
  }
}
```

`POST /api/auth/sign-in`

Signs in with Supabase email/password and sets secure session cookies.

`POST /api/auth/sign-out`

Clears LineUp session cookies.

`GET /api/auth/me`

Returns the signed-in profile and role.

`POST /api/onboarding/business`

Creates a saved business, location, staff record, and queue for an already signed-in user.

## Business Settings

`PATCH /api/business/settings`

Requires business owner or admin access when Supabase is configured.

```json
{
  "businessId": "business-id",
  "locationId": "location-id",
  "queueId": "queue-id",
  "businessName": "Fade Masters",
  "locationName": "Greenbelt",
  "locationAddress": "7500 Greenway Center Dr, Greenbelt, MD",
  "queueName": "Walk-ins",
  "averageServiceMinutes": 16,
  "fastPassEnabled": true,
  "fastPassPriceCents": 1200
}
```

## Queues

`GET /api/queues/[queueId]`

Returns a queue snapshot.

`POST /api/queues/[queueId]/join`

```json
{
  "customerName": "Maya Johnson",
  "customerPhone": "+12025550112",
  "customerEmail": "maya@example.com",
  "partySize": 1,
  "channels": ["push", "sms", "email"]
}
```

`POST /api/business/queues/[queueId]/call-next`

Marks the current serving customer as served, calls the next waiting customer, and sends notifications.
Requires business owner, staff, or admin access when Supabase is configured.

`PATCH /api/business/queues/[queueId]/status`

```json
{ "status": "paused" }
```

Requires business owner, staff, or admin access when Supabase is configured.

## Queue Entries

`PATCH /api/queue-entries/[entryId]`

```json
{ "action": "served" }
```

Allowed actions: `leave`, `skip`, `served`.
`skip` and `served` require business owner, staff, or admin access when Supabase is configured.

`POST /api/queue-entries/[entryId]/fast-pass`

Creates a Stripe Checkout session in production or applies demo Fast Pass locally.

## Payments

`POST /api/stripe/checkout`

```json
{
  "businessId": "biz_fade_masters",
  "planId": "professional"
}
```

`POST /api/stripe/webhook`

Stripe webhook for subscription and Fast Pass events.

## AI

`POST /api/ai/wait-time`

```json
{ "queueId": "queue_greenbelt_walkins" }
```

`POST /api/ai/insights`

```json
{ "queueId": "queue_greenbelt_walkins" }
```

## Notifications

`POST /api/notifications`

```json
{
  "entryId": "entry_3",
  "message": "You are next in line."
}
```
