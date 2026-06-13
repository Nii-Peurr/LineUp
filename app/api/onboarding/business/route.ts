import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createBusinessOnboarding } from "@/lib/data-store";
import { hasSupabaseAuthConfig } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  businessName: z.string().min(1),
  locationName: z.string().min(1),
  locationAddress: z.string().min(1),
  queueName: z.string().min(1),
  averageServiceMinutes: z.number().int().min(1).max(120),
  fastPassEnabled: z.boolean(),
  fastPassPriceCents: z.number().int().min(0)
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseAuthConfig()) {
      return NextResponse.json(
        {
          error:
            "Supabase Auth is not configured. Add Supabase URL, anon key, and service role key to enable saved businesses."
        },
        { status: 503 }
      );
    }

    const profile = await getCurrentProfile(request);

    if (!profile) {
      return NextResponse.json({ error: "Sign in before creating a business." }, { status: 401 });
    }

    const input = onboardingSchema.parse(await request.json());
    const onboarding = await createBusinessOnboarding({
      ownerId: profile.id,
      ownerName: profile.name,
      ownerEmail: profile.email,
      ownerPhone: profile.phone,
      ...input
    });

    return NextResponse.json({
      businessId: onboarding.business.id,
      queueId: onboarding.queue.id,
      redirectTo: `/business?businessId=${onboarding.business.id}`,
      dashboard: onboarding.dashboard
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create business." },
      { status: 400 }
    );
  }
}
