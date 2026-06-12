import { NextResponse } from "next/server";
import { z } from "zod";
import { createPlanCheckoutSession } from "@/lib/services/stripe";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "professional", "enterprise"]),
  businessId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const origin = new URL(request.url).origin;
    const checkout = await createPlanCheckoutSession({
      ...input,
      successUrl: `${origin}/business?checkout=success`,
      cancelUrl: `${origin}/business?checkout=cancelled`
    });

    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout." },
      { status: 400 }
    );
  }
}
