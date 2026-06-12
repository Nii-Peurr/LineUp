import type {
  Business,
  FastPassMode,
  Queue,
  QueueEntry,
  QueueSnapshot
} from "@/lib/types";

const demandMultiplier = {
  light: 0.82,
  normal: 1,
  heavy: 1.18
} satisfies Record<Queue["currentDemand"], number>;

export function activeQueueEntries(entries: QueueEntry[]) {
  return entries
    .filter((entry) => entry.status === "serving" || entry.status === "waiting")
    .sort((a, b) => a.position - b.position || a.joinedAt.localeCompare(b.joinedAt));
}

export function waitingQueueEntries(entries: QueueEntry[]) {
  return activeQueueEntries(entries).filter((entry) => entry.status === "waiting");
}

export function calculateEstimatedWaitMinutes(
  queue: Queue,
  entries: QueueEntry[],
  entryId?: string
) {
  const activeEntries = activeQueueEntries(entries);
  const targetIndex = entryId
    ? activeEntries.findIndex((entry) => entry.id === entryId)
    : activeEntries.filter((entry) => entry.status === "waiting").length;
  const peopleAhead = Math.max(0, targetIndex);
  const staffCount = Math.max(1, queue.activeStaff);
  const baseMinutes = (peopleAhead * queue.averageServiceMinutes) / staffCount;

  return Math.max(0, Math.round(baseMinutes * demandMultiplier[queue.currentDemand]));
}

export function getPeopleAhead(entries: QueueEntry[], entryId: string) {
  const activeEntries = activeQueueEntries(entries);
  const targetIndex = activeEntries.findIndex((entry) => entry.id === entryId);

  if (targetIndex < 0) {
    return 0;
  }

  return activeEntries.slice(0, targetIndex).filter((entry) => entry.status !== "served").length;
}

export function reorderWaitingEntries(entries: QueueEntry[]) {
  const serving = entries.filter((entry) => entry.status === "serving");
  const waiting = entries
    .filter((entry) => entry.status === "waiting")
    .sort((a, b) => a.position - b.position || a.joinedAt.localeCompare(b.joinedAt));
  const inactive = entries.filter(
    (entry) => entry.status !== "serving" && entry.status !== "waiting"
  );

  return [
    ...serving.map((entry, index) => ({ ...entry, position: index })),
    ...waiting.map((entry, index) => ({ ...entry, position: serving.length + index + 1 })),
    ...inactive
  ];
}

export function applyFastPass(
  entries: QueueEntry[],
  entryId: string,
  mode: FastPassMode
) {
  if (mode === "disabled") {
    throw new Error("Fast Pass is disabled for this business.");
  }

  const activeEntries = activeQueueEntries(entries);
  const target = activeEntries.find((entry) => entry.id === entryId);

  if (!target || target.status !== "waiting") {
    throw new Error("Only waiting customers can use Fast Pass.");
  }

  const waitingEntries = activeEntries.filter((entry) => entry.status === "waiting");
  const fastPassCount = waitingEntries.filter((entry) => entry.fastPass).length;

  if (mode === "limited" && fastPassCount >= 3) {
    throw new Error("Fast Pass is temporarily sold out for this queue.");
  }

  const serving = entries.filter((entry) => entry.status === "serving");
  const inactive = entries.filter(
    (entry) => entry.status !== "serving" && entry.status !== "waiting"
  );
  const remainingWaiting = waitingEntries.filter((entry) => entry.id !== entryId);
  const promoted = { ...target, fastPass: true, updatedAt: new Date().toISOString() };

  return [
    ...serving.map((entry, index) => ({ ...entry, position: index })),
    promoted,
    ...remainingWaiting
  ]
    .map((entry, index) => ({ ...entry, position: serving.length ? index : index + 1 }))
    .concat(inactive);
}

export function callNext(entries: QueueEntry[]) {
  const updatedAt = new Date().toISOString();
  const normalized = reorderWaitingEntries(entries).map((entry) =>
    entry.status === "serving" ? { ...entry, status: "served" as const, updatedAt } : entry
  );
  const waiting = normalized
    .filter((entry) => entry.status === "waiting")
    .sort((a, b) => a.position - b.position);
  const next = waiting[0];

  if (!next) {
    return normalized;
  }

  return reorderWaitingEntries(
    normalized.map((entry) =>
      entry.id === next.id
        ? { ...entry, status: "serving" as const, position: 0, updatedAt }
        : entry
    )
  );
}

export function skipEntry(entries: QueueEntry[], entryId: string) {
  return reorderWaitingEntries(
    entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, status: "skipped" as const, updatedAt: new Date().toISOString() }
        : entry
    )
  );
}

export function markServed(entries: QueueEntry[], entryId: string) {
  return reorderWaitingEntries(
    entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, status: "served" as const, updatedAt: new Date().toISOString() }
        : entry
    )
  );
}

export function leaveQueue(entries: QueueEntry[], entryId: string) {
  return reorderWaitingEntries(
    entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, status: "left" as const, updatedAt: new Date().toISOString() }
        : entry
    )
  );
}

export function buildSnapshot(
  queue: Queue,
  business: Business,
  location: QueueSnapshot["location"],
  entries: QueueEntry[]
): QueueSnapshot {
  const activeEntries = activeQueueEntries(entries);
  const waitingEntries = waitingQueueEntries(entries);
  const servingEntry = activeEntries.find((entry) => entry.status === "serving");

  return {
    queue,
    business,
    location,
    entries: reorderWaitingEntries(entries),
    activeEntries,
    waitingEntries,
    servingEntry,
    averageWaitMinutes: calculateEstimatedWaitMinutes(queue, entries),
    dailyCustomers: entries.filter((entry) => entry.status === "served").length + activeEntries.length,
    missedTurnRate: 0.07
  };
}
