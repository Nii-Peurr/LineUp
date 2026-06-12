import {
  adminAnalytics,
  businesses,
  insights,
  locations,
  queueEntries,
  queueHistory,
  queues,
  staff,
  users
} from "@/lib/demo-data";
import {
  applyFastPass,
  buildSnapshot,
  callNext,
  calculateEstimatedWaitMinutes,
  leaveQueue,
  markServed,
  reorderWaitingEntries,
  skipEntry
} from "@/lib/queue-engine";
import type {
  Business,
  Location,
  NotificationChannel,
  Queue,
  QueueEntry,
  QueueSnapshot
} from "@/lib/types";

type DemoStoreState = {
  entries: QueueEntry[];
  queues: Queue[];
};

const globalStore = globalThis as typeof globalThis & {
  __lineupDemoStore?: DemoStoreState;
};

const state =
  globalStore.__lineupDemoStore ??
  (globalStore.__lineupDemoStore = {
    entries: queueEntries.map((entry) => ({ ...entry })),
    queues: queues.map((queue) => ({ ...queue }))
  });

function findQueueContext(queueId: string) {
  const queue = state.queues.find((candidate) => candidate.id === queueId);

  if (!queue) {
    throw new Error("Queue not found.");
  }

  const location = locations.find((candidate) => candidate.id === queue.locationId);

  if (!location) {
    throw new Error("Location not found.");
  }

  const business = businesses.find((candidate) => candidate.id === location.businessId);

  if (!business) {
    throw new Error("Business not found.");
  }

  return { business, location, queue };
}

export function listDirectory() {
  return businesses.map((business) => ({
    business,
    locations: locations.filter((location) => location.businessId === business.id),
    queues: state.queues.filter((queue) =>
      locations.some(
        (location) => location.businessId === business.id && location.id === queue.locationId
      )
    )
  }));
}

export function listBusinesses() {
  return businesses;
}

export function listUsers() {
  return users;
}

export function listStaff(locationId: string) {
  return staff.filter((member) => member.locationId === locationId);
}

export function listInsights() {
  return insights;
}

export function getAdminAnalytics() {
  return adminAnalytics;
}

export function getQueueHistory() {
  return queueHistory;
}

export function getQueueSnapshot(queueId = "queue_greenbelt_walkins"): QueueSnapshot {
  const { business, location, queue } = findQueueContext(queueId);
  const entries = state.entries.filter((entry) => entry.queueId === queueId);

  return buildSnapshot(queue, business, location, entries);
}

export function getQueueEntry(entryId: string) {
  return state.entries.find((entry) => entry.id === entryId);
}

export function getBusinessDashboardData(businessId = "biz_fade_masters") {
  const business = businesses.find((candidate) => candidate.id === businessId) as Business;
  const ownedLocations = locations.filter((location) => location.businessId === businessId);
  const ownedQueues = state.queues.filter((queue) =>
    ownedLocations.some((location) => location.id === queue.locationId)
  );
  const snapshots = ownedQueues.map((queue) => getQueueSnapshot(queue.id));

  return {
    business,
    locations: ownedLocations,
    queues: ownedQueues,
    snapshots,
    insights,
    staff: staff.filter((member) =>
      ownedLocations.some((location) => location.id === member.locationId)
    )
  };
}

export function joinQueue(input: {
  queueId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize?: number;
  channels?: NotificationChannel[];
}) {
  const { queue } = findQueueContext(input.queueId);
  const queueScopedEntries = state.entries.filter((entry) => entry.queueId === input.queueId);
  const now = new Date().toISOString();
  const nextPosition =
    Math.max(0, ...queueScopedEntries.map((entry) => entry.position).filter(Boolean)) + 1;
  const entry: QueueEntry = {
    id: `entry_${crypto.randomUUID()}`,
    queueId: input.queueId,
    customerId: `customer_${crypto.randomUUID()}`,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    status: "waiting",
    position: nextPosition,
    partySize: input.partySize ?? 1,
    fastPass: false,
    quotedWaitMinutes: calculateEstimatedWaitMinutes(queue, queueScopedEntries),
    joinedAt: now,
    updatedAt: now,
    notificationChannels: input.channels ?? ["push", "sms", "email"]
  };

  state.entries = reorderWaitingEntries([...state.entries, entry]);

  return entry;
}

export function updateQueueStatus(queueId: string, status: Queue["status"]) {
  state.queues = state.queues.map((queue) =>
    queue.id === queueId ? { ...queue, status } : queue
  );

  return getQueueSnapshot(queueId);
}

export function buyFastPass(entryId: string) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const { business } = findQueueContext(entry.queueId);
  const scoped = state.entries.filter((candidate) => candidate.queueId === entry.queueId);
  const promoted = applyFastPass(scoped, entryId, business.fastPassMode);
  const scopedIds = new Set(scoped.map((candidate) => candidate.id));

  state.entries = state.entries
    .filter((candidate) => !scopedIds.has(candidate.id))
    .concat(promoted);

  return getQueueSnapshot(entry.queueId);
}

export function leaveQueueByEntry(entryId: string) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const scoped = state.entries.filter((candidate) => candidate.queueId === entry.queueId);
  const scopedIds = new Set(scoped.map((candidate) => candidate.id));

  state.entries = state.entries
    .filter((candidate) => !scopedIds.has(candidate.id))
    .concat(leaveQueue(scoped, entryId));

  return getQueueSnapshot(entry.queueId);
}

export function callNextForQueue(queueId: string) {
  const scoped = state.entries.filter((candidate) => candidate.queueId === queueId);
  const scopedIds = new Set(scoped.map((candidate) => candidate.id));

  state.entries = state.entries
    .filter((candidate) => !scopedIds.has(candidate.id))
    .concat(callNext(scoped));

  return getQueueSnapshot(queueId);
}

export function skipQueueEntry(entryId: string) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const scoped = state.entries.filter((candidate) => candidate.queueId === entry.queueId);
  const scopedIds = new Set(scoped.map((candidate) => candidate.id));

  state.entries = state.entries
    .filter((candidate) => !scopedIds.has(candidate.id))
    .concat(skipEntry(scoped, entryId));

  return getQueueSnapshot(entry.queueId);
}

export function markQueueEntryServed(entryId: string) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const scoped = state.entries.filter((candidate) => candidate.queueId === entry.queueId);
  const scopedIds = new Set(scoped.map((candidate) => candidate.id));

  state.entries = state.entries
    .filter((candidate) => !scopedIds.has(candidate.id))
    .concat(markServed(scoped, entryId));

  return getQueueSnapshot(entry.queueId);
}

export function getLocationsForBusiness(businessId: string): Location[] {
  return locations.filter((location) => location.businessId === businessId);
}

export function resetDemoStoreForTests() {
  state.entries = queueEntries.map((entry) => ({ ...entry }));
  state.queues = queues.map((queue) => ({ ...queue }));
}
