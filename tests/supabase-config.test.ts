import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSupabaseAdmin,
  hasSupabaseAuthConfig,
  hasSupabaseConfig
} from "@/lib/supabase/server";

describe("Supabase server config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps anon auth available when the service role key is not header-safe", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon_test_key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_bad\nvalue");

    expect(hasSupabaseAuthConfig()).toBe(true);
    expect(hasSupabaseConfig()).toBe(false);
    expect(getSupabaseAdmin()).toBeNull();
  });
});
