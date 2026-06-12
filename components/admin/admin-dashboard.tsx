"use client";

import {
  Ban,
  Building2,
  Crown,
  DollarSign,
  Gauge,
  LineChart,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import { useMemo, useState } from "react";
import { DemoModeBadge } from "@/components/demo-mode-badge";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency } from "@/lib/utils";
import type { AdminAnalytics, Business, User } from "@/lib/types";

export function AdminDashboard({
  analytics,
  businesses,
  users
}: {
  analytics: AdminAnalytics;
  businesses: Business[];
  users: User[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filteredBusinesses = useMemo(
    () =>
      businesses.filter((business) => {
        const matchesQuery = business.name.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || business.planStatus === status;
        return matchesQuery && matchesStatus;
      }),
    [businesses, query, status]
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold tracking-normal">Super Admin</h1>
            <DemoModeBadge />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage businesses, users, subscriptions, revenue, and queue performance.
          </p>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-[260px_180px] lg:w-auto">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-12 pl-9 sm:h-10"
              placeholder="Search businesses"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select
            className="h-12 sm:h-10"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="trialing">Trialing</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Building2}
          label="Businesses"
          value={analytics.businesses.toLocaleString("en-US")}
          trend="+14.2% MoM"
        />
        <MetricCard
          icon={Users}
          label="Users"
          value={analytics.users.toLocaleString("en-US")}
          trend="+31.8% MoM"
          tone="success"
        />
        <MetricCard
          icon={DollarSign}
          label="MRR"
          value={currency(analytics.monthlyRecurringRevenueCents)}
          trend="Net retention 119%"
          tone="success"
        />
        <MetricCard
          icon={Crown}
          label="Fast Pass"
          value={currency(analytics.fastPassRevenueCents)}
          trend="12.6% attach rate"
          tone="warning"
        />
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Businesses</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-0">
            <div className="grid gap-3 md:hidden">
              {filteredBusinesses.map((business) => (
                <div key={business.id} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{business.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{business.category}</p>
                    </div>
                    <Badge variant={business.planStatus === "active" ? "success" : "warning"}>
                      {business.planStatus}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-semibold capitalize">{business.plan}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Fast Pass</span>
                      <Badge variant={business.fastPassMode === "disabled" ? "muted" : "warning"}>
                        {business.fastPassMode}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold">{currency(business.revenueMonthCents)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold">{business.planStatus}</span>
                    </div>
                  </div>
                  <Button className="mt-4 h-12 w-full" variant="secondary">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-normal text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Fast Pass</th>
                    <th className="px-4 py-3 font-semibold">Revenue</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBusinesses.map((business) => (
                    <tr key={business.id}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{business.name}</p>
                          <p className="text-xs text-muted-foreground">{business.category}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{business.plan}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={business.fastPassMode === "disabled" ? "muted" : "warning"}
                        >
                          {business.fastPassMode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{currency(business.revenueMonthCents)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={business.planStatus === "active" ? "success" : "warning"}>
                          {business.planStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary">
                            Manage
                          </Button>
                          <Button size="sm" variant="ghost" title="Suspend account">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Active queues</p>
                  <p className="mt-2 text-xl font-semibold">
                    {analytics.activeQueues.toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Churn risk</p>
                  <p className="mt-2 text-xl font-semibold">
                    {analytics.churnRiskAccounts.toLocaleString("en-US")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-12 items-end gap-1 overflow-hidden">
                {[30, 44, 52, 71, 64, 83, 91, 72, 68, 88, 79, 96].map((height, index) => (
                  <div
                    key={index}
                    className="flex h-20 items-end rounded bg-muted p-0.5 sm:h-24 sm:p-1"
                  >
                    <div className="w-full rounded bg-primary" style={{ height: `${height}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LineChart className="h-4 w-4" />
                Platform queue volume by month
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.suspended ? "danger" : "muted"}>{user.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Subscription Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="secondary">
                <Gauge className="h-4 w-4" />
                Manage Stripe Plans
              </Button>
              <Button className="w-full" variant="secondary">
                <Crown className="h-4 w-4" />
                Manage Fast Pass Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
