import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { SiteNav } from "@/components/site-nav";
import { getAdminAnalytics, listBusinesses, listUsers } from "@/lib/store";

export default function AdminPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <AdminDashboard
          analytics={getAdminAnalytics()}
          businesses={listBusinesses()}
          users={listUsers()}
        />
      </main>
    </>
  );
}
