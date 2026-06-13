import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookies } from "@/lib/auth";
import { createBusinessOnboarding } from "@/lib/data-store";
import {
  getSupabaseAdmin,
  getSupabaseAuthClient,
  hasSupabaseAuthConfig
} from "@/lib/supabase/server";

const businessSchema = z.object({
  businessName: z.string().min(1),
  locationName: z.string().min(1),
  locationAddress: z.string().min(1),
  queueName: z.string().min(1),
  averageServiceMinutes: z.number().int().min(1).max(120),
  fastPassEnabled: z.boolean(),
  fastPassPriceCents: z.number().int().min(0)
});

const signUpSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(["customer", "business_owner"]).default("customer"),
  business: businessSchema.optional()
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseAuthConfig()) {
      return NextResponse.json(
        {
          error:
            "Supabase Auth is not configured. Add Supabase URL and anon key to enable account creation."
        },
        { status: 503 }
      );
    }

    const input = signUpSchema.parse(await request.json());
    const authClient = getSupabaseAuthClient();

    if (!authClient) {
      throw new Error("Supabase Auth is not configured.");
    }

    if (input.role === "business_owner" && !input.business) {
      return NextResponse.json(
        { error: "Business onboarding details are required." },
        { status: 400 }
      );
    }

    const { data, error } = await authClient.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          role: input.role
        }
      }
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Unable to create account.");
    }

    if (data.session) {
      await setSessionCookies(data.session);
    }

    const admin = getSupabaseAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Supabase database admin key is not configured correctly. Account auth succeeded, but LineUp could not save the profile."
        },
        { status: 503 }
      );
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    const onboarding =
      input.role === "business_owner" && input.business
        ? await createBusinessOnboarding({
            ownerId: data.user.id,
            ownerName: input.fullName,
            ownerEmail: input.email,
            ownerPhone: input.phone,
            ...input.business
          })
        : null;

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: input.email,
        name: input.fullName,
        role: input.role
      },
      businessId: onboarding?.business.id,
      queueId: onboarding?.queue.id,
      requiresEmailConfirmation: !data.session,
      redirectTo:
        input.role === "business_owner" && onboarding
          ? `/business?businessId=${onboarding.business.id}`
          : "/customer"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 400 }
    );
  }
}
