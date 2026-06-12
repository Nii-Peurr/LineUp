"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, LogIn, Menu, Shield, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    href: "/",
    label: "Customer",
    icon: Smartphone
  },
  {
    href: "/business",
    label: "Business",
    icon: Building2
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Shield
  }
] as const;

export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          onClick={() => setMobileOpen(false)}
        >
          <Image src="/lineup-mark.svg" alt="" width={32} height={32} priority />
          <span>LineUp</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth">Sign in</Link>
          </Button>
          <ThemeToggle />
          <Button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden"
            size="icon"
            title={mobileOpen ? "Close menu" : "Open menu"}
            variant="secondary"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {mobileOpen ? (
        <nav className="border-t bg-background px-4 py-3 shadow-soft md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                className="h-12 justify-start text-base"
                variant="ghost"
              >
                <Link href={item.href} onClick={() => setMobileOpen(false)}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button asChild className="h-12 justify-start text-base" variant="secondary">
              <Link href="/auth" onClick={() => setMobileOpen(false)}>
                <LogIn className="h-5 w-5" />
                Auth
              </Link>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
