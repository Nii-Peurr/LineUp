import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookies } from "@/lib/auth";
import {
  getSupabaseAdmin,
  getSupabaseAuthClient,
  hasSupabaseAuthConfig
} from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    if (!hasSupabaseAuthConfig()) {
      return NextResponse.json(
        {
          error:
            "Supabase Auth is not configured. Add Supabase URL, anon key, and service role key to enable saved accounts."
        },
        { status: 503 }
      );
    }

    const input = signInSchema.parse(await request.json());
    const authClient = getSupabaseAuthClient();
    const admin = getSupabaseAdmin();

    if (!authClient || !admin) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await authClient.auth.signInWithPassword(input);

    if (error || !data.user || !data.session) {
      throw new Error(error?.message ?? "Unable to sign in.");
    }

    await setSessionCookies(data.session);

    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", data.user.id)
      .maybeSingle();
    const role = profile?.role ?? "customer";

    if (!profile) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        full_name:
          data.user.user_metadata.full_name ??
          data.user.email?.split("@")[0] ??
          "LineUp Customer",
        email: data.user.email ?? input.email,
        role: "customer",
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name ?? data.user.user_metadata.full_name ?? "LineUp Customer",
        role
      },
      redirectTo:
        role === "admin" ? "/admin" : role === "business_owner" || role === "staff" ? "/business" : "/customer"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign in." },
      { status: 400 }
    );
  }
}
