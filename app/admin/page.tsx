import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SiteNav } from "@/components/site-nav";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import { getAdminAnalytics, listBusinesses, listUsers, usingDemoStore } from "@/lib/data-store";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = hasSupabaseConfig() ? await getCurrentProfile() : null;

  if (!usingDemoStore() && !hasRole(profile, ["admin"])) {
    redirect("/auth?next=/admin");
  }

  const [analytics, businesses, users] = await Promise.all([
    getAdminAnalytics(),
    listBusinesses(),
    listUsers()
  ]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <AdminDashboard
          analytics={analytics}
          businesses={businesses}
          users={users}
        />
      </main>
    </>
  );
}
