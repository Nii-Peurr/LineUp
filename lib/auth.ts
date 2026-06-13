import { cookies } from "next/headers";
import { getSupabaseAdmin, getSupabaseAuthClient } from "@/lib/supabase/server";
import type { Role, User } from "@/lib/types";

const ACCESS_COOKIE = "lineup_access_token";
const REFRESH_COOKIE = "lineup_refresh_token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  suspended_at: string | null;
};

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    suspended: Boolean(row.suspended_at)
  };
}

export async function setSessionCookies(session: {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    ...COOKIE_OPTIONS,
    maxAge: session.expires_in ?? 60 * 60
  });

  if (session.refresh_token) {
    cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30
    });
  }
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getRequestAccessToken(request?: Request) {
  const header = request?.headers.get("authorization");

  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }

  const cookieStore = await cookies();

  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getCurrentProfile(request?: Request) {
  const authClient = getSupabaseAuthClient();
  const token = await getRequestAccessToken(request);

  if (!authClient || !token) {
    return null;
  }

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, suspended_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error || !profile || profile.suspended_at) {
    return null;
  }

  return mapProfile(profile);
}

export function hasRole(profile: User | null, roles: Role[]) {
  return Boolean(profile && roles.includes(profile.role) && !profile.suspended);
}

export async function isBusinessMember(userId: string, businessId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return false;
  }

  const { data: ownedBusiness } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedBusiness) {
    return true;
  }

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(membership);
}
