import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

function readEnv(name: string) {
  const value = process.env[name]?.trim();

  return value || undefined;
}

function isHeaderSafe(value: string) {
  return !/[\r\n\0]/.test(value);
}

function getSupabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

function getSupabaseAnonKey() {
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return key && isHeaderSafe(key) ? key : undefined;
}

function getSupabaseServiceRoleKey() {
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  return key && isHeaderSafe(key) ? key : undefined;
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey() && getSupabaseServiceRoleKey());
}

export function hasSupabaseAuthConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}

export function getSupabaseAuthClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  if (!authClient) {
    authClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return authClient;
}
