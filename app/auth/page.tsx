import { Suspense } from "react";
import { AuthOnboarding } from "@/components/auth/auth-onboarding";
import { SiteNav } from "@/components/site-nav";

export default function AuthPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={null}>
        <AuthOnboarding />
      </Suspense>
    </>
  );
}
