"use client";

import {
  Activity,
  BarChart3,
  Check,
  Clock,
  Crown,
  MapPin,
  Pause,
  Play,
  SkipForward,
  Timer,
  UserCheck,
  UserMinus,
  Users
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DemoModeBadge } from "@/components/demo-mode-badge";
import { MetricCard } from "@/components/metric-card";
import { QueueList } from "@/components/queue-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currency, minutesLabel } from "@/lib/utils";
import type { Business, Insight, Location, Queue, QueueSnapshot, StaffMember } from "@/lib/types";

type BusinessDashboardData = {
  business: Business;
  locations: Location[];
  queues: Queue[];
  snapshots: QueueSnapshot[];
  insights: Insight[];
  staff: StaffMember[];
};

export function BusinessDashboard({ initialData }: { initialData: BusinessDashboardData }) {
  const [data, setData] = useState(initialData);
  const [selectedQueueId, setSelectedQueueId] = useState(initialData.snapshots[0]?.queue.id);
  const [averageServiceMinutes, setAverageServiceMinutes] = useState(
    initialData.snapshots[0]?.queue.averageServiceMinutes ?? 15
  );
  const [isPending, startTransition] = useTransition();
  const snapshot = useMemo(
    () =>
      data.snapshots.find((candidate) => candidate.queue.id === selectedQueueId) ??
      data.snapshots[0],
    [data.snapshots, selectedQueueId]
  );
  const serving = snapshot?.servingEntry;
  const selectedLocation = snapshot?.location;
  const activeStaff = data.staff.filter((member) => member.active).length;

  function replaceSnapshot(next: QueueSnapshot) {
    setData((current) => ({
      ...current,
      snapshots: current.snapshots.map((candidate) =>
        candidate.queue.id === next.queue.id ? next : candidate
      )
    }));
  }

  function queueAction(endpoint: string, body?: Record<string, unknown>) {
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const payload = (await response.json()) as { snapshot: QueueSnapshot };
      replaceSnapshot(payload.snapshot);
    });
  }

  function setQueueStatus(status: Queue["status"]) {
    startTransition(async () => {
      const response = await fetch(`/api/business/queues/${snapshot.queue.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as { snapshot: QueueSnapshot };
      replaceSnapshot(payload.snapshot);
    });
  }

  if (!snapshot) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">{data.business.name}</h1>
            <DemoModeBadge />
            <Badge variant="outline">{data.business.plan}</Badge>
            <Badge variant={data.business.planStatus === "active" ? "success" : "warning"}>
              {data.business.planStatus}
            </Badge>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {selectedLocation.name} - {selectedLocation.address}
          </p>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-[260px_auto_auto] lg:w-auto">
          <Select
            className="h-12 sm:h-10"
            value={selectedQueueId}
            onChange={(event) => setSelectedQueueId(event.target.value)}
          >
            {data.snapshots.map((item) => (
              <option key={item.queue.id} value={item.queue.id}>
                {item.location.name} - {item.queue.name}
              </option>
            ))}
          </Select>
          <Button
            className="h-12 sm:h-10"
            variant={snapshot.queue.status === "paused" ? "default" : "secondary"}
            onClick={() => setQueueStatus(snapshot.queue.status === "paused" ? "open" : "paused")}
            disabled={isPending}
          >
            {snapshot.queue.status === "paused" ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            {snapshot.queue.status === "paused" ? "Resume" : "Pause"}
          </Button>
          <Button
            className="h-12 sm:h-10"
            onClick={() => queueAction(`/api/business/queues/${snapshot.queue.id}/call-next`)}
            disabled={isPending || !snapshot.waitingEntries.length}
          >
            <UserCheck className="h-4 w-4" />
            Call Next
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Current Queue"
          value={String(snapshot.activeEntries.length)}
          trend={`${snapshot.waitingEntries.length} waiting`}
        />
        <MetricCard
          icon={Clock}
          label="Average Wait"
          value={minutesLabel(snapshot.averageWaitMinutes)}
          trend={`${snapshot.queue.activeStaff} active staff`}
          tone="success"
        />
        <MetricCard
          icon={Activity}
          label="Daily Customers"
          value={String(snapshot.dailyCustomers)}
          trend="18% above last Tuesday"
          tone="success"
        />
        <MetricCard
          icon={Crown}
          label="Fast Pass Revenue"
          value={currency(data.business.revenueMonthCents)}
          trend={`${currency(data.business.fastPassPriceCents)} each`}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{snapshot.queue.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Serving {serving?.customerName ?? "no one"} now
                </p>
              </div>
              <Badge variant={snapshot.queue.status === "open" ? "success" : "warning"}>
                {snapshot.queue.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {snapshot.queue.status === "paused" ? (
              <div className="rounded-lg border bg-warning/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                Queue paused. Staff can resume the line when they are ready to call customers.
              </div>
            ) : null}
            {!snapshot.waitingEntries.length ? (
              <div className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
                No customers waiting.
              </div>
            ) : null}
            <QueueList entries={snapshot.activeEntries} emptyMessage="No customers waiting" />
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                className="h-12 sm:h-10"
                variant="secondary"
                disabled={!serving || isPending}
                onClick={() =>
                  serving &&
                  queueAction(`/api/queue-entries/${serving.id}`, { action: "served" })
                }
              >
                <Check className="h-4 w-4" />
                Mark Served
              </Button>
              <Button
                className="h-12 sm:h-10"
                variant="secondary"
                disabled={!serving || isPending}
                onClick={() =>
                  serving && queueAction(`/api/queue-entries/${serving.id}`, { action: "skip" })
                }
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              <Button
                className="h-12 sm:h-10"
                variant="destructive"
                disabled={!serving || isPending}
                onClick={() =>
                  serving && queueAction(`/api/queue-entries/${serving.id}`, { action: "leave" })
                }
              >
                <UserMinus className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Queue Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium">
                Average service time
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    className="h-12 sm:h-10"
                    type="number"
                    min={1}
                    max={120}
                    value={averageServiceMinutes}
                    onChange={(event) => setAverageServiceMinutes(Number(event.target.value))}
                  />
                  <Button className="h-12 sm:h-10" variant="secondary">
                    <Timer className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </label>
              <div className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Fast Pass</span>
                  <Badge variant={data.business.fastPassMode === "disabled" ? "muted" : "warning"}>
                    {data.business.fastPassMode}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-sm font-semibold">
                    {currency(data.business.fastPassPriceCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Active staff</span>
                  <span className="text-sm font-semibold">{activeStaff}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.insights.map((insight) => (
                <div key={insight.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <Badge
                      variant={
                        insight.severity === "warning"
                          ? "warning"
                          : insight.severity === "success"
                            ? "success"
                            : "muted"
                      }
                    >
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{insight.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 items-end gap-2">
                {[42, 56, 38, 61, 92, 78, 50].map((height, index) => (
                  <div key={index} className="flex h-28 items-end rounded-md bg-muted p-1">
                    <div
                      className="w-full rounded bg-accent"
                      style={{ height: `${height}%` }}
                      aria-label={`Queue volume ${height}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Daily queue volume by hour
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
