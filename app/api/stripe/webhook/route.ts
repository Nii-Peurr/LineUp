import { NextResponse } from "next/server";
import { buyFastPass } from "@/lib/store";
import { getStripeClient } from "@/lib/services/stripe";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.metadata?.purchaseType === "fast_pass" && session.metadata.entryId) {
        buyFastPass(session.metadata.entryId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook." },
      { status: 400 }
    );
  }
}
