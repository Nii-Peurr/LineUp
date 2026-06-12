import { BusinessDashboard } from "@/components/business/business-dashboard";
import { SiteNav } from "@/components/site-nav";
import { getBusinessDashboardData } from "@/lib/store";

export default function BusinessPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <BusinessDashboard initialData={getBusinessDashboardData()} />
      </main>
    </>
  );
}
