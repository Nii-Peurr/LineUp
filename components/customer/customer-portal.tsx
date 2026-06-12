"use client";

import {
  Bell,
  Building2,
  Clock,
  Crown,
  Heart,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  UserMinus,
  Users
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DemoModeBadge } from "@/components/demo-mode-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { QueueList } from "@/components/queue-list";
import { Select } from "@/components/ui/select";
import { currency, minutesLabel } from "@/lib/utils";
import type {
  Business,
  Location,
  Queue,
  QueueEntry,
  QueueHistoryItem,
  QueueSnapshot
} from "@/lib/types";

type DirectoryItem = {
  business: Business;
  locations: Location[];
  queues: Queue[];
};

export function CustomerPortal({
  directory,
  initialSnapshot,
  history
}: {
  directory: DirectoryItem[];
  initialSnapshot: QueueSnapshot;
  history: QueueHistoryItem[];
}) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null | undefined>(initialSnapshot);
  const [selectedQueueId, setSelectedQueueId] = useState(initialSnapshot.queue.id);
  const [activeEntry, setActiveEntry] = useState<QueueEntry | undefined>(
    initialSnapshot.entries.find((entry) => entry.customerName === "Maya Johnson")
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>([initialSnapshot.business.id]);
  const [form, setForm] = useState({
    name: "Maya Johnson",
    phone: "+12025550112",
    email: "maya@example.com",
    partySize: 1
  });
  const [fastPassMessage, setFastPassMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const safeSnapshot = snapshot ?? initialSnapshot;
  const activeEntries = safeSnapshot?.activeEntries ?? [];
  const activeEntryInQueue = activeEntry
    ? activeEntries.find((entry) => entry.id === activeEntry.id)
    : undefined;
  const isActivelyInQueue = Boolean(activeEntryInQueue);
  const peopleAhead = activeEntryInQueue
    ? Math.max(0, activeEntries.findIndex((entry) => entry.id === activeEntryInQueue.id))
    : 0;
  const waitProgress = isActivelyInQueue ? Math.max(8, Math.min(100, 100 - peopleAhead * 22)) : 0;
  const positionLabel = activeEntryInQueue ? String(activeEntryInQueue.position) : "Not in queue";
  const currentWaitMinutes = isActivelyInQueue ? safeSnapshot.averageWaitMinutes : 0;
  const fastPassWaitMinutes = isActivelyInQueue
    ? Math.max(0, currentWaitMinutes - safeSnapshot.queue.averageServiceMinutes)
    : 0;
  const queuePaused = safeSnapshot.queue.status === "paused";
  const fastPassDisabled =
    !isActivelyInQueue || safeSnapshot.business.fastPassMode === "disabled" || isPending;

  const queueOptions = useMemo(
    () =>
      directory.flatMap((item) =>
        item.queues.map((queue) => {
          const location = item.locations.find((candidate) => candidate.id === queue.locationId);
          return {
            id: queue.id,
            label: `${item.business.name} - ${location?.name ?? "Location"} - ${queue.name}`
          };
        })
      ),
    [directory]
  );

  function setFavorite(businessId: string) {
    setFavoriteIds((current) =>
      current.includes(businessId)
        ? current.filter((id) => id !== businessId)
        : current.concat(businessId)
    );
  }

  function join() {
    setFastPassMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/queues/${selectedQueueId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
          partySize: form.partySize,
          channels: ["push", "sms", "email"]
        })
      });
      const data = (await response.json()) as { entry?: QueueEntry; snapshot?: QueueSnapshot };
      setSnapshot(data.snapshot ?? safeSnapshot);

      if (data.entry) {
        setActiveEntry(data.entry);
      }
    });
  }

  function leave() {
    if (!activeEntryInQueue) {
      return;
    }

    setFastPassMessage(null);

    startTransition(async () => {
      const entryId = activeEntryInQueue.id;
      const response = await fetch(`/api/queue-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" })
      });
      const data = (await response.json()) as { snapshot?: QueueSnapshot };
      setSnapshot(data.snapshot ?? safeSnapshot);
      setActiveEntry(undefined);
    });
  }

  function fastPass() {
    if (!activeEntryInQueue) {
      setFastPassMessage("Join the queue before using Fast Pass.");
      return;
    }

    startTransition(async () => {
      const entryId = activeEntryInQueue.id;
      const response = await fetch(`/api/queue-entries/${entryId}/fast-pass`, {
        method: "POST"
      });
      const data = (await response.json()) as {
        snapshot?: QueueSnapshot;
        checkoutUrl?: string;
        error?: string;
        message?: string;
      };
      const nextSnapshot = data.snapshot ?? safeSnapshot;

      setSnapshot(nextSnapshot);

      if (!response.ok) {
        setActiveEntry(nextSnapshot.activeEntries.find((entry) => entry.id === entryId));
        setFastPassMessage(
          data.message ?? data.error ?? "Fast Pass is not available for this queue right now."
        );
        return;
      }

      setFastPassMessage(null);
      setActiveEntry(nextSnapshot.entries.find((entry) => entry.id === entryId));
    });
  }

  return (
    <section className="queue-grid min-h-[calc(100vh-65px)]">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Your Position
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{positionLabel}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    People Ahead
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{peopleAhead}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-accent" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Est. Wait
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {minutesLabel(currentWaitMinutes)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-success" />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{safeSnapshot.business.name}</CardTitle>
                    <DemoModeBadge />
                    <Badge variant={safeSnapshot.queue.status === "open" ? "success" : "warning"}>
                      {safeSnapshot.queue.status}
                    </Badge>
                    <Badge variant="outline">{safeSnapshot.business.category}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {safeSnapshot.location.name} - {safeSnapshot.location.address}
                  </p>
                </div>
                <Button
                  variant={favoriteIds.includes(safeSnapshot.business.id) ? "default" : "secondary"}
                  onClick={() => setFavorite(safeSnapshot.business.id)}
                >
                  <Heart className="h-4 w-4" />
                  Favorite
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {queuePaused ? (
                <div className="mb-4 rounded-lg border bg-warning/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                  Queue paused. You can still view your place, but the business is not calling new
                  customers right now.
                </div>
              ) : null}
              {!isActivelyInQueue ? (
                <div className="mb-4 rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
                  Not in queue. Join when you are ready and LineUp will show your live position.
                </div>
              ) : null}
              <div className="mb-5 grid gap-4 md:grid-cols-[1fr_220px]">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Live queue progress</span>
                    <span className="text-muted-foreground">Updates every few seconds</span>
                  </div>
                  <Progress value={waitProgress} className="mt-3" />
                </div>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Alerts enabled
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="muted">
                      <Bell className="mr-1 h-3 w-3" />
                      Push
                    </Badge>
                    <Badge variant="muted">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      SMS
                    </Badge>
                    <Badge variant="muted">
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Badge>
                  </div>
                </div>
              </div>
              <QueueList entries={activeEntries} emptyMessage="No customers waiting" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card id="join-queue">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Join a Line</CardTitle>
                <DemoModeBadge />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium">
                Business and queue
                <Select
                  className="mt-2 h-12 sm:h-10"
                  value={selectedQueueId}
                  onChange={(event) => setSelectedQueueId(event.target.value)}
                >
                  {queueOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Name
                  <Input
                    className="mt-2 h-12 sm:h-10"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Party
                  <Input
                    className="mt-2 h-12 sm:h-10"
                    type="number"
                    min={1}
                    max={12}
                    value={form.partySize}
                    onChange={(event) =>
                      setForm({ ...form, partySize: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                <Phone className="mr-1 inline h-4 w-4" />
                Phone
                <Input
                  className="mt-2 h-12 sm:h-10"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                <Mail className="mr-1 inline h-4 w-4" />
                Email
                <Input
                  className="mt-2 h-12 sm:h-10"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="h-12 sm:h-10" onClick={join} disabled={isPending || !form.name}>
                  <Building2 className="h-4 w-4" />
                  Join Queue
                </Button>
                <Button
                  className="h-12 sm:h-10"
                  variant="secondary"
                  onClick={leave}
                  disabled={!isActivelyInQueue || isPending}
                >
                  <UserMinus className="h-4 w-4" />
                  Leave
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-700 dark:text-amber-200" />
                  <p className="text-sm font-semibold">Move closer to the front of the line</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border bg-background p-2">
                    <p className="text-xs text-muted-foreground">Current wait</p>
                    <p className="font-semibold">{minutesLabel(currentWaitMinutes)}</p>
                  </div>
                  <div className="rounded-md border bg-background p-2">
                    <p className="text-xs text-muted-foreground">Fast Pass wait</p>
                    <p className="font-semibold">{minutesLabel(fastPassWaitMinutes)}</p>
                  </div>
                </div>
              </div>
              {fastPassMessage ? (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {fastPassMessage}
                </div>
              ) : null}
              <Button
                className="h-12 w-full text-base sm:h-10 sm:text-sm"
                variant="accent"
                onClick={fastPass}
                disabled={fastPassDisabled}
              >
                <Crown className="h-4 w-4" />
                Fast Pass {currency(safeSnapshot.business.fastPassPriceCents)}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <History className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.locationName} - waited {minutesLabel(item.waitMinutes)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
