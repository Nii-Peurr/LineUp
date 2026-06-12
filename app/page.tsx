import { CustomerPortal } from "@/components/customer/customer-portal";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { getQueueHistory, getQueueSnapshot, listDirectory } from "@/lib/store";
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main>
        <section className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Virtual queues for busy shops
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
              Never Wait In Line Again
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Join virtual queues from anywhere, track your position live, and get notified when
              it&apos;s your turn.
            </p>
            <div className="mt-6 grid gap-3 sm:flex">
              <Button asChild className="h-12 text-base">
                <Link href="#join-queue">
                  Join Queue
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild className="h-12 text-base" variant="secondary">
                <Link href="/business">
                  <Building2 className="h-5 w-5" />
                  View Business Demo
                </Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-md border bg-background px-3 py-2">
                <span className="font-semibold">Fade Masters</span>
                <span className="text-muted-foreground"> - Greenbelt walk-ins</span>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <span className="font-semibold">Live position</span>
                <span className="text-muted-foreground"> - updates as the line moves</span>
              </div>
              <div className="rounded-md border bg-background px-3 py-2">
                <span className="font-semibold">SMS ready</span>
                <span className="text-muted-foreground"> - alerts before the chair</span>
              </div>
            </div>
          </div>
        </section>
        <CustomerPortal
          directory={listDirectory()}
          initialSnapshot={getQueueSnapshot()}
          history={getQueueHistory()}
        />
      </main>
    </>
  );
}
