import * as demoStore from "@/lib/store";
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
import { insights as demoInsights, queueHistory as demoQueueHistory } from "@/lib/demo-data";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase/server";
import type {
  AdminAnalytics,
  Business,
  FastPassMode,
  Insight,
  Location,
  NotificationChannel,
  PlanId,
  Queue,
  QueueEntry,
  QueueHistoryItem,
  QueueSnapshot,
  QueueStatus,
  Role,
  StaffMember,
  User
} from "@/lib/types";

type DirectoryItem = {
  business: Business;
  locations: Location[];
  queues: Queue[];
};

type BusinessDashboardData = {
  business: Business;
  locations: Location[];
  queues: Queue[];
  snapshots: QueueSnapshot[];
  insights: Insight[];
  staff: StaffMember[];
};

type BusinessSettingsInput = {
  businessId: string;
  locationId: string;
  queueId: string;
  businessName: string;
  locationName: string;
  locationAddress: string;
  queueName: string;
  averageServiceMinutes: number;
  fastPassEnabled: boolean;
  fastPassPriceCents: number;
};

type OnboardingInput = {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  businessName: string;
  locationName: string;
  locationAddress: string;
  queueName: string;
  averageServiceMinutes: number;
  fastPassEnabled: boolean;
  fastPassPriceCents: number;
};

type BusinessRow = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  plan: PlanId;
  plan_status: Business["planStatus"];
  stripe_customer_id: string | null;
  fast_pass_mode: FastPassMode;
  fast_pass_price_cents: number;
  monthly_customer_limit: number | null;
  suspended_at: string | null;
};

type LocationRow = {
  id: string;
  business_id: string;
  name: string;
  address: string;
  timezone: string;
  phone: string | null;
  business_hours: Location["hours"];
};

type QueueRow = {
  id: string;
  location_id: string;
  name: string;
  status: QueueStatus;
  average_service_minutes: number;
  active_staff: number;
  current_demand: Queue["currentDemand"];
  sms_enabled: boolean;
};

type EntryRow = {
  id: string;
  queue_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: QueueEntry["status"];
  position: number;
  party_size: number;
  fast_pass: boolean;
  quoted_wait_minutes: number;
  notification_channels: NotificationChannel[];
  joined_at: string;
  updated_at: string;
};

type StaffRow = {
  id: string;
  location_id: string;
  display_name: string;
  title: string;
  active: boolean;
};

type InsightRow = {
  id: string;
  title: string;
  body: string;
  severity: Insight["severity"];
};

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  suspended_at: string | null;
};

function isDemoMode() {
  return !hasSupabaseConfig();
}

function supabaseOrThrow() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function mapBusiness(row: BusinessRow, revenueMonthCents = 0): Business {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category,
    plan: row.plan,
    planStatus: row.plan_status,
    fastPassMode: row.fast_pass_mode,
    fastPassPriceCents: row.fast_pass_price_cents,
    monthlyCustomerLimit: row.monthly_customer_limit,
    stripeCustomerId: row.stripe_customer_id ?? undefined,
    revenueMonthCents,
    suspended: Boolean(row.suspended_at)
  };
}

function mapLocation(row: LocationRow): Location {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    address: row.address,
    timezone: row.timezone,
    phone: row.phone ?? "",
    hours: row.business_hours ?? []
  };
}

function mapQueue(row: QueueRow): Queue {
  return {
    id: row.id,
    locationId: row.location_id,
    name: row.name,
    status: row.status,
    averageServiceMinutes: row.average_service_minutes,
    activeStaff: row.active_staff,
    currentDemand: row.current_demand,
    smsEnabled: row.sms_enabled
  };
}

function mapEntry(row: EntryRow): QueueEntry {
  return {
    id: row.id,
    queueId: row.queue_id,
    customerId: row.customer_id ?? "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    status: row.status,
    position: row.position,
    partySize: row.party_size,
    fastPass: row.fast_pass,
    quotedWaitMinutes: row.quoted_wait_minutes,
    joinedAt: row.joined_at,
    updatedAt: row.updated_at,
    notificationChannels: row.notification_channels ?? []
  };
}

function mapStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    locationId: row.location_id,
    name: row.display_name,
    role: row.title,
    active: row.active
  };
}

function mapInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    severity: row.severity
  };
}

function mapUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    suspended: Boolean(row.suspended_at)
  };
}

async function getBusinessRevenueCents(businessId: string) {
  const supabase = supabaseOrThrow();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents")
    .eq("business_id", businessId)
    .eq("status", "succeeded")
    .gte("created_at", monthStart.toISOString());

  if (error) {
    return 0;
  }

  return ((data ?? []) as { amount_cents: number }[]).reduce(
    (total, payment) => total + payment.amount_cents,
    0
  );
}

async function getQueueContext(queueId?: string) {
  const supabase = supabaseOrThrow();
  const queueQuery = supabase
    .from("queues")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  const { data: queueRow, error: queueError } = queueId
    ? await supabase.from("queues").select("*").eq("id", queueId).single<QueueRow>()
    : await queueQuery.single<QueueRow>();

  if (queueError || !queueRow) {
    throw new Error("Queue not found.");
  }

  const { data: locationRow, error: locationError } = await supabase
    .from("locations")
    .select("*")
    .eq("id", queueRow.location_id)
    .single<LocationRow>();

  if (locationError || !locationRow) {
    throw new Error("Location not found.");
  }

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", locationRow.business_id)
    .single<BusinessRow>();

  if (businessError || !businessRow) {
    throw new Error("Business not found.");
  }

  return {
    business: mapBusiness(businessRow, await getBusinessRevenueCents(businessRow.id)),
    location: mapLocation(locationRow),
    queue: mapQueue(queueRow)
  };
}

async function getScopedEntries(queueId: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("queue_id", queueId)
    .order("position", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as EntryRow[]).map(mapEntry);
}

async function persistEntries(entries: QueueEntry[]) {
  const supabase = supabaseOrThrow();
  const updatedAt = new Date().toISOString();

  await Promise.all(
    entries.map((entry) =>
      supabase
        .from("queue_entries")
        .update({
          status: entry.status,
          position: entry.position,
          fast_pass: entry.fastPass,
          updated_at: entry.updatedAt || updatedAt
        })
        .eq("id", entry.id)
    )
  );
}

async function getOwnedBusinessId(userId: string, preferredBusinessId?: string, role?: Role) {
  const supabase = supabaseOrThrow();

  if (preferredBusinessId) {
    if (role === "admin") {
      return preferredBusinessId;
    }

    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", preferredBusinessId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (owned) {
      return preferredBusinessId;
    }

    const { data: membership } = await supabase
      .from("business_memberships")
      .select("id")
      .eq("business_id", preferredBusinessId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membership) {
      return preferredBusinessId;
    }

    throw new Error("You do not have access to this business.");
  }

  if (role === "admin") {
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return data?.id as string | undefined;
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (owned?.id) {
    return owned.id as string;
  }

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return membership?.business_id as string | undefined;
}

export async function listDirectory(): Promise<DirectoryItem[]> {
  if (isDemoMode()) {
    return demoStore.listDirectory();
  }

  const supabase = supabaseOrThrow();
  const [{ data: businessRows }, { data: locationRows }, { data: queueRows }] = await Promise.all([
    supabase.from("businesses").select("*").is("suspended_at", null),
    supabase.from("locations").select("*"),
    supabase.from("queues").select("*")
  ]);
  const businesses = ((businessRows ?? []) as BusinessRow[]).map((row) => mapBusiness(row));
  const locations = ((locationRows ?? []) as LocationRow[]).map(mapLocation);
  const queues = ((queueRows ?? []) as QueueRow[]).map(mapQueue);

  return businesses.map((business) => ({
    business,
    locations: locations.filter((location) => location.businessId === business.id),
    queues: queues.filter((queue) =>
      locations.some(
        (location) => location.businessId === business.id && location.id === queue.locationId
      )
    )
  }));
}

export async function listBusinesses(): Promise<Business[]> {
  if (isDemoMode()) {
    return demoStore.listBusinesses();
  }

  const supabase = supabaseOrThrow();
  const { data, error } = await supabase.from("businesses").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(
    ((data ?? []) as BusinessRow[]).map(async (row) =>
      mapBusiness(row, await getBusinessRevenueCents(row.id))
    )
  );
}

export async function listUsers(): Promise<User[]> {
  if (isDemoMode()) {
    return demoStore.listUsers();
  }

  const supabase = supabaseOrThrow();
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ProfileRow[]).map(mapUser);
}

export async function listInsights(businessId?: string): Promise<Insight[]> {
  if (isDemoMode()) {
    return demoStore.listInsights();
  }

  const supabase = supabaseOrThrow();
  let query = supabase.from("ai_insights").select("*").order("created_at", { ascending: false });

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data, error } = await query.limit(6);

  if (error || !data?.length) {
    return demoInsights;
  }

  return (data as InsightRow[]).map(mapInsight);
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  if (isDemoMode()) {
    return demoStore.getAdminAnalytics();
  }

  const supabase = supabaseOrThrow();
  const [
    businessesResult,
    usersResult,
    activeQueuesResult,
    paymentsResult,
    churnRiskResult
  ] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("queues").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("payments").select("amount_cents").eq("status", "succeeded"),
    supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("plan_status", "past_due")
  ]);
  const payments = (paymentsResult.data ?? []) as { amount_cents: number }[];
  const revenue = payments.reduce((total, payment) => total + payment.amount_cents, 0);

  return {
    businesses: businessesResult.count ?? 0,
    users: usersResult.count ?? 0,
    monthlyRecurringRevenueCents: revenue,
    fastPassRevenueCents: revenue,
    activeQueues: activeQueuesResult.count ?? 0,
    churnRiskAccounts: churnRiskResult.count ?? 0
  };
}

export async function getQueueHistory(): Promise<QueueHistoryItem[]> {
  if (isDemoMode()) {
    return demoStore.getQueueHistory();
  }

  return demoQueueHistory;
}

export async function getQueueSnapshot(queueId?: string): Promise<QueueSnapshot> {
  if (isDemoMode()) {
    return demoStore.getQueueSnapshot(queueId);
  }

  const { business, location, queue } = await getQueueContext(queueId);
  const entries = await getScopedEntries(queue.id);

  return buildSnapshot(queue, business, location, entries);
}

export async function getQueueEntry(entryId: string): Promise<QueueEntry | undefined> {
  if (isDemoMode()) {
    return demoStore.getQueueEntry(entryId);
  }

  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle<EntryRow>();

  if (error || !data) {
    return undefined;
  }

  return mapEntry(data);
}

export async function getBusinessDashboardData(
  businessId?: string,
  userId?: string,
  role?: Role
): Promise<BusinessDashboardData> {
  if (isDemoMode()) {
    return demoStore.getBusinessDashboardData(businessId);
  }

  const supabase = supabaseOrThrow();
  const resolvedBusinessId = userId
    ? await getOwnedBusinessId(userId, businessId, role)
    : businessId;

  if (!resolvedBusinessId) {
    throw new Error("No business found for this account.");
  }

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", resolvedBusinessId)
    .single<BusinessRow>();

  if (businessError || !businessRow) {
    throw new Error("Business not found.");
  }

  const { data: locationRows } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", resolvedBusinessId)
    .order("created_at", { ascending: true });
  const locations = ((locationRows ?? []) as LocationRow[]).map(mapLocation);
  const locationIds = locations.map((location) => location.id);
  const [{ data: queueRows }, { data: staffRows }] = await Promise.all([
    locationIds.length
      ? supabase.from("queues").select("*").in("location_id", locationIds)
      : Promise.resolve({ data: [] }),
    locationIds.length
      ? supabase.from("staff_members").select("*").in("location_id", locationIds)
      : Promise.resolve({ data: [] })
  ]);
  const queues = ((queueRows ?? []) as QueueRow[]).map(mapQueue);
  const snapshots = await Promise.all(queues.map((queue) => getQueueSnapshot(queue.id)));

  return {
    business: mapBusiness(businessRow, await getBusinessRevenueCents(resolvedBusinessId)),
    locations,
    queues,
    snapshots,
    insights: await listInsights(resolvedBusinessId),
    staff: ((staffRows ?? []) as StaffRow[]).map(mapStaff)
  };
}

export async function joinQueue(input: {
  queueId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize?: number;
  channels?: NotificationChannel[];
}): Promise<QueueEntry> {
  if (isDemoMode()) {
    return demoStore.joinQueue(input);
  }

  const supabase = supabaseOrThrow();
  const { queue } = await getQueueContext(input.queueId);
  const queueScopedEntries = await getScopedEntries(input.queueId);
  const now = new Date().toISOString();
  const activePositions = queueScopedEntries
    .filter((entry) => entry.status === "serving" || entry.status === "waiting")
    .map((entry) => entry.position);
  const nextPosition = Math.max(0, ...activePositions) + 1;
  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: input.queueId,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      customer_email: input.customerEmail,
      status: "waiting",
      position: nextPosition,
      party_size: input.partySize ?? 1,
      fast_pass: false,
      quoted_wait_minutes: calculateEstimatedWaitMinutes(queue, queueScopedEntries),
      notification_channels: input.channels ?? ["push", "sms", "email"],
      joined_at: now,
      updated_at: now
    })
    .select("*")
    .single<EntryRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to join queue.");
  }

  const normalized = reorderWaitingEntries([...(await getScopedEntries(input.queueId))]);
  await persistEntries(normalized);

  return mapEntry(data);
}

export async function updateQueueStatus(queueId: string, status: Queue["status"]) {
  if (isDemoMode()) {
    return demoStore.updateQueueStatus(queueId, status);
  }

  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("queues")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", queueId);

  if (error) {
    throw new Error(error.message);
  }

  return getQueueSnapshot(queueId);
}

export async function buyFastPass(entryId: string) {
  if (isDemoMode()) {
    return demoStore.buyFastPass(entryId);
  }

  const entry = await getQueueEntry(entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const { business } = await getQueueContext(entry.queueId);
  const scoped = await getScopedEntries(entry.queueId);
  const promoted = applyFastPass(scoped, entryId, business.fastPassMode);

  await persistEntries(promoted);

  return getQueueSnapshot(entry.queueId);
}

export async function leaveQueueByEntry(entryId: string) {
  if (isDemoMode()) {
    return demoStore.leaveQueueByEntry(entryId);
  }

  const entry = await getQueueEntry(entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const updated = leaveQueue(await getScopedEntries(entry.queueId), entryId);
  await persistEntries(updated);

  return getQueueSnapshot(entry.queueId);
}

export async function callNextForQueue(queueId: string) {
  if (isDemoMode()) {
    return demoStore.callNextForQueue(queueId);
  }

  const updated = callNext(await getScopedEntries(queueId));
  await persistEntries(updated);

  return getQueueSnapshot(queueId);
}

export async function skipQueueEntry(entryId: string) {
  if (isDemoMode()) {
    return demoStore.skipQueueEntry(entryId);
  }

  const entry = await getQueueEntry(entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const updated = skipEntry(await getScopedEntries(entry.queueId), entryId);
  await persistEntries(updated);

  return getQueueSnapshot(entry.queueId);
}

export async function markQueueEntryServed(entryId: string) {
  if (isDemoMode()) {
    return demoStore.markQueueEntryServed(entryId);
  }

  const entry = await getQueueEntry(entryId);

  if (!entry) {
    throw new Error("Queue entry not found.");
  }

  const updated = markServed(await getScopedEntries(entry.queueId), entryId);
  await persistEntries(updated);

  return getQueueSnapshot(entry.queueId);
}

export async function updateBusinessSettings(input: BusinessSettingsInput) {
  if (isDemoMode()) {
    const snapshot = demoStore.getQueueSnapshot(input.queueId);
    return {
      ...demoStore.getBusinessDashboardData(input.businessId),
      snapshots: [snapshot]
    };
  }

  const supabase = supabaseOrThrow();
  const fastPassMode: FastPassMode = input.fastPassEnabled ? "unlimited" : "disabled";

  const [businessResult, locationResult, queueResult] = await Promise.all([
    supabase
      .from("businesses")
      .update({
        name: input.businessName,
        fast_pass_mode: fastPassMode,
        fast_pass_price_cents: input.fastPassPriceCents,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.businessId),
    supabase
      .from("locations")
      .update({
        name: input.locationName,
        address: input.locationAddress,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.locationId),
    supabase
      .from("queues")
      .update({
        name: input.queueName,
        average_service_minutes: input.averageServiceMinutes,
        updated_at: new Date().toISOString()
      })
      .eq("id", input.queueId)
  ]);

  const error = businessResult.error ?? locationResult.error ?? queueResult.error;

  if (error) {
    throw new Error(error.message);
  }

  return getBusinessDashboardData(input.businessId);
}

export async function createBusinessOnboarding(input: OnboardingInput) {
  const supabase = supabaseOrThrow();
  const fastPassMode: FastPassMode = input.fastPassEnabled ? "unlimited" : "disabled";
  const hours = [
    0, 1, 2, 3, 4, 5, 6
  ].map((day) => ({ day, open: "09:00", close: day === 0 ? "16:00" : "19:00", closed: false }));

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: input.ownerId,
    full_name: input.ownerName,
    email: input.ownerEmail,
    phone: input.ownerPhone,
    role: "business_owner",
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .insert({
      owner_id: input.ownerId,
      name: input.businessName,
      category: "Barbershop",
      plan: "starter",
      plan_status: "trialing",
      fast_pass_mode: fastPassMode,
      fast_pass_price_cents: input.fastPassPriceCents,
      monthly_customer_limit: 100
    })
    .select("*")
    .single<BusinessRow>();

  if (businessError || !businessRow) {
    throw new Error(businessError?.message ?? "Unable to create business.");
  }

  const { data: locationRow, error: locationError } = await supabase
    .from("locations")
    .insert({
      business_id: businessRow.id,
      name: input.locationName,
      address: input.locationAddress,
      timezone: "America/New_York",
      phone: input.ownerPhone,
      business_hours: hours
    })
    .select("*")
    .single<LocationRow>();

  if (locationError || !locationRow) {
    throw new Error(locationError?.message ?? "Unable to create location.");
  }

  const [{ error: membershipError }, { error: staffError }, { data: queueRow, error: queueError }] =
    await Promise.all([
      supabase.from("business_memberships").insert({
        business_id: businessRow.id,
        user_id: input.ownerId,
        role: "business_owner"
      }),
      supabase.from("staff_members").insert({
        location_id: locationRow.id,
        profile_id: input.ownerId,
        display_name: input.ownerName,
        title: "Owner",
        active: true
      }),
      supabase
        .from("queues")
        .insert({
          location_id: locationRow.id,
          name: input.queueName,
          status: "open",
          average_service_minutes: input.averageServiceMinutes,
          active_staff: 1,
          current_demand: "normal",
          sms_enabled: true
        })
        .select("*")
        .single<QueueRow>()
    ]);

  const error = membershipError ?? staffError ?? queueError;

  if (error || !queueRow) {
    throw new Error(error?.message ?? "Unable to finish onboarding.");
  }

  return {
    business: mapBusiness(businessRow),
    location: mapLocation(locationRow),
    queue: mapQueue(queueRow),
    dashboard: await getBusinessDashboardData(businessRow.id, input.ownerId, "business_owner")
  };
}

export function usingDemoStore() {
  return isDemoMode();
}

