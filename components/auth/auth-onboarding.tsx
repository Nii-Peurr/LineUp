"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { Building2, Mail, ShieldCheck, User } from "lucide-react";
import { DemoModeBadge } from "@/components/demo-mode-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthMode = "business" | "customer" | "signin";

export function AuthOnboarding() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [mode, setMode] = useState<AuthMode>(next === "/business" ? "signin" : "business");
  const [account, setAccount] = useState({
    fullName: "Avery Brooks",
    email: "owner@example.com",
    password: "",
    phone: "+12025550100"
  });
  const [business, setBusiness] = useState({
    businessName: "Fade Masters",
    locationName: "Greenbelt",
    locationAddress: "7500 Greenway Center Dr, Greenbelt, MD",
    queueName: "Walk-ins",
    averageServiceMinutes: 16,
    fastPassEnabled: true,
    fastPassPrice: "12.00"
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validateAccount(role: "customer" | "business_owner" | "signin") {
    if (!account.email || !account.password) {
      setMessage("Email and password are required.");
      return false;
    }

    if (role !== "signin" && !account.fullName) {
      setMessage("Full name is required.");
      return false;
    }

    if (role === "business_owner" && !business.businessName) {
      setMessage("Business name is required.");
      return false;
    }

    return true;
  }

  function submitSignUp(role: "customer" | "business_owner") {
    setMessage(null);

    if (!validateAccount(role)) {
      return;
    }

    startTransition(async () => {
      try {
        setMessage(role === "business_owner" ? "Creating business account..." : "Creating account...");

        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...account,
            role,
            business:
              role === "business_owner"
                ? {
                    businessName: business.businessName,
                    locationName: business.locationName,
                    locationAddress: business.locationAddress,
                    queueName: business.queueName,
                    averageServiceMinutes: business.averageServiceMinutes,
                    fastPassEnabled: business.fastPassEnabled,
                    fastPassPriceCents: Math.max(
                      0,
                      Math.round(Number(business.fastPassPrice) * 100)
                    )
                  }
                : undefined
          })
        });
        const payload = (await response.json()) as {
          error?: string;
          redirectTo?: string;
          requiresEmailConfirmation?: boolean;
        };

        if (!response.ok) {
          setMessage(payload.error ?? "Unable to create account.");
          return;
        }

        if (payload.requiresEmailConfirmation) {
          setMessage("Account created. Confirm the email address, then sign in to continue.");
          setMode("signin");
          return;
        }

        setMessage("Account created. Opening your dashboard...");
        window.location.href =
          payload.redirectTo ?? (role === "business_owner" ? "/business" : "/customer");
      } catch {
        setMessage("Unable to reach the auth service. Please try again.");
      }
    });
  }

  function submitSignIn() {
    setMessage(null);

    if (!validateAccount("signin")) {
      return;
    }

    startTransition(async () => {
      try {
        setMessage("Signing in...");

        const response = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: account.email,
            password: account.password
          })
        });
        const payload = (await response.json()) as { error?: string; redirectTo?: string };

        if (!response.ok) {
          setMessage(payload.error ?? "Unable to sign in.");
          return;
        }

        setMessage("Signed in. Opening your workspace...");
        window.location.href = next ?? payload.redirectTo ?? "/customer";
      } catch {
        setMessage("Unable to reach the auth service. Please try again.");
      }
    });
  }

  function submitCurrentMode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "signin") {
      submitSignIn();
      return;
    }

    submitSignUp(mode === "business" ? "business_owner" : "customer");
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl items-center gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px]">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Customer-ready MVP
          </p>
          <DemoModeBadge />
        </div>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal sm:text-5xl">
          Sign up, create a queue, and start serving real customers.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Business owners get saved shops, locations, queues, Fast Pass settings, and role-gated
          dashboard access when Supabase is configured.
        </p>
        <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[
            ["Customer", "Join and manage queue visits"],
            ["Business owner", "Create and run saved queues"],
            ["Admin", "Manage platform accounts"]
          ].map(([label, copy]) => (
            <div key={label} className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              {mode === "business"
                ? "Business Onboarding"
                : mode === "customer"
                  ? "Customer Account"
                  : "Welcome Back"}
            </CardTitle>
            <Badge variant="outline">Supabase Auth</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submitCurrentMode}>
            <div className="grid grid-cols-3 gap-2">
              <Button
                className="h-11 px-2 text-xs sm:text-sm"
                type="button"
                variant={mode === "business" ? "default" : "secondary"}
                onClick={() => {
                  setMode("business");
                  setMessage("Business owner signup selected.");
                }}
              >
                <Building2 className="h-4 w-4" />
                Owner
              </Button>
              <Button
                className="h-11 px-2 text-xs sm:text-sm"
                type="button"
                variant={mode === "customer" ? "default" : "secondary"}
                onClick={() => {
                  setMode("customer");
                  setMessage("Customer signup selected.");
                }}
              >
                <User className="h-4 w-4" />
                Customer
              </Button>
              <Button
                className="h-11 px-2 text-xs sm:text-sm"
                type="button"
                variant={mode === "signin" ? "default" : "secondary"}
                onClick={() => {
                  setMode("signin");
                  setMessage("Sign in selected.");
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Sign In
              </Button>
            </div>

            {mode !== "signin" ? (
              <label className="block text-sm font-medium">
                Full name
                <Input
                  className="mt-2 h-12 sm:h-10"
                  value={account.fullName}
                  onChange={(event) => setAccount({ ...account, fullName: event.target.value })}
                />
              </label>
            ) : null}

            <label className="block text-sm font-medium">
              <Mail className="mr-1 inline h-4 w-4" />
              Email
              <Input
                className="mt-2 h-12 sm:h-10"
                type="email"
                value={account.email}
                onChange={(event) => setAccount({ ...account, email: event.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <Input
                className="mt-2 h-12 sm:h-10"
                type="password"
                value={account.password}
                onChange={(event) => setAccount({ ...account, password: event.target.value })}
              />
            </label>

            {mode === "business" ? (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <label className="block text-sm font-medium">
                  Business name
                  <Input
                    className="mt-2 h-12 sm:h-10"
                    value={business.businessName}
                    onChange={(event) =>
                      setBusiness({ ...business, businessName: event.target.value })
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Location
                    <Input
                      className="mt-2 h-12 sm:h-10"
                      value={business.locationName}
                      onChange={(event) =>
                        setBusiness({ ...business, locationName: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Queue name
                    <Input
                      className="mt-2 h-12 sm:h-10"
                      value={business.queueName}
                      onChange={(event) =>
                        setBusiness({ ...business, queueName: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Address
                  <Input
                    className="mt-2 h-12 sm:h-10"
                    value={business.locationAddress}
                    onChange={(event) =>
                      setBusiness({ ...business, locationAddress: event.target.value })
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Service minutes
                    <Input
                      className="mt-2 h-12 sm:h-10"
                      type="number"
                      min={1}
                      max={120}
                      value={business.averageServiceMinutes}
                      onChange={(event) =>
                        setBusiness({
                          ...business,
                          averageServiceMinutes: Number(event.target.value)
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Fast Pass price
                    <Input
                      className="mt-2 h-12 sm:h-10"
                      type="number"
                      min={0}
                      step="0.01"
                      value={business.fastPassPrice}
                      onChange={(event) =>
                        setBusiness({ ...business, fastPassPrice: event.target.value })
                      }
                    />
                  </label>
                </div>
                <Button
                  className="h-11 w-full"
                  type="button"
                  variant={business.fastPassEnabled ? "accent" : "secondary"}
                  onClick={() => {
                    setBusiness({ ...business, fastPassEnabled: !business.fastPassEnabled });
                    setMessage(
                      `Fast Pass ${business.fastPassEnabled ? "disabled" : "enabled"}.`
                    );
                  }}
                >
                  Fast Pass {business.fastPassEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            ) : null}

            {message ? (
              <div
                role="status"
                className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground"
              >
                {message}
              </div>
            ) : null}

            <Button
              className="h-12 w-full text-base sm:h-10 sm:text-sm"
              type="submit"
              disabled={isPending}
            >
              {mode === "signin"
                ? "Sign In"
                : mode === "business"
                  ? "Create Business"
                  : "Create Customer Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
