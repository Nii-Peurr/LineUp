import { BusinessDashboard } from "@/components/business/business-dashboard";
import { SiteNav } from "@/components/site-nav";
import { getCurrentProfile, hasRole } from "@/lib/auth";
import { getBusinessDashboardData, usingDemoStore } from "@/lib/data-store";
import { hasSupabaseConfig } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BusinessPage({
  searchParams
}: {
  searchParams?: Promise<{ businessId?: string }>;
}) {
  const params = await searchParams;
  const profile = hasSupabaseConfig() ? await getCurrentProfile() : null;

  if (!usingDemoStore() && !hasRole(profile, ["business_owner", "staff", "admin"])) {
    redirect("/auth?next=/business");
  }

  const data = await getBusinessDashboardData(
    params?.businessId,
    profile?.id,
    profile?.role
  );

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <BusinessDashboard initialData={data} />
      </main>
    </>
  );
}
