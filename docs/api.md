# API

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

`PATCH /api/business/queues/[queueId]/status`

```json
{ "status": "paused" }
```

## Queue Entries

`PATCH /api/queue-entries/[entryId]`

```json
{ "action": "served" }
```

Allowed actions: `leave`, `skip`, `served`.

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
