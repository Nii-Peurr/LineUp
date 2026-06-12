import Stripe from "stripe";
import { plans } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil"
  });
}

export async function createPlanCheckoutSession(input: {
  planId: PlanId;
  businessId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();
  const plan = plans.find((candidate) => candidate.id === input.planId);

  if (!stripe || !plan?.stripeLookupKey) {
    return {
      mode: "demo" as const,
      url: `/business?checkout=demo&plan=${input.planId}`
    };
  }

  const prices = await stripe.prices.list({
    lookup_keys: [plan.stripeLookupKey],
    limit: 1
  });
  const price = prices.data[0];

  if (!price) {
    throw new Error(`Stripe price lookup key not found: ${plan.stripeLookupKey}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      businessId: input.businessId,
      planId: input.planId
    }
  });

  return {
    mode: "stripe" as const,
    url: session.url
  };
}

export async function createFastPassCheckoutSession(input: {
  businessId: string;
  entryId: string;
  priceCents: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripeClient();

  if (!stripe) {
    return {
      mode: "demo" as const,
      url: `/customer?fastPass=demo&entry=${input.entryId}`
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "LineUp Fast Pass"
          },
          unit_amount: input.priceCents
        },
        quantity: 1
      }
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      businessId: input.businessId,
      entryId: input.entryId,
      purchaseType: "fast_pass"
    }
  });

  return {
    mode: "stripe" as const,
    url: session.url
  };
}
