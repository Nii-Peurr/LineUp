import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { hasSupabaseAuthConfig } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!hasSupabaseAuthConfig()) {
    return NextResponse.json({ mode: "demo", profile: null });
  }

  const profile = await getCurrentProfile(request);

  if (!profile) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  return NextResponse.json({ profile });
}
