import { Apple, Mail } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl items-center gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Virtual queue operations
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal sm:text-5xl">
            Sign in to run queues, serve customers, and keep wait times visible.
          </h1>
          <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Google", "Apple", "Email"].map((label) => (
              <div key={label} className="rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">Supabase Auth provider</p>
              </div>
            ))}
          </div>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="secondary">
              <Mail className="h-4 w-4" />
              Continue with Google
            </Button>
            <Button className="w-full" variant="secondary">
              <Apple className="h-4 w-4" />
              Continue with Apple
            </Button>
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-2" type="email" placeholder="you@company.com" />
            </label>
            <Button className="w-full">Send magic link</Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
