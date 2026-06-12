export type PlanId = "starter" | "professional" | "enterprise";

export type Role = "customer" | "business_owner" | "staff" | "admin";

export type QueueEntryStatus =
  | "waiting"
  | "serving"
  | "served"
  | "skipped"
  | "missed"
  | "left";

export type QueueStatus = "open" | "paused" | "closed";

export type FastPassMode = "disabled" | "limited" | "unlimited";

export type NotificationChannel = "push" | "sms" | "email";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatarColor?: string;
  suspended?: boolean;
};

export type Business = {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  plan: PlanId;
  planStatus: "trialing" | "active" | "past_due" | "canceled";
  fastPassMode: FastPassMode;
  fastPassPriceCents: number;
  monthlyCustomerLimit: number | null;
  stripeCustomerId?: string;
  revenueMonthCents: number;
  suspended?: boolean;
};

export type Location = {
  id: string;
  businessId: string;
  name: string;
  address: string;
  timezone: string;
  phone: string;
  hours: BusinessHours[];
};

export type BusinessHours = {
  day: number;
  open: string;
  close: string;
  closed?: boolean;
};

export type StaffMember = {
  id: string;
  locationId: string;
  name: string;
  role: string;
  active: boolean;
};

export type Queue = {
  id: string;
  locationId: string;
  name: string;
  status: QueueStatus;
  averageServiceMinutes: number;
  activeStaff: number;
  currentDemand: "light" | "normal" | "heavy";
  smsEnabled: boolean;
};

export type QueueEntry = {
  id: string;
  queueId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: QueueEntryStatus;
  position: number;
  partySize: number;
  fastPass: boolean;
  quotedWaitMinutes: number;
  joinedAt: string;
  updatedAt: string;
  notificationChannels: NotificationChannel[];
};

export type QueueSnapshot = {
  queue: Queue;
  business: Business;
  location: Location;
  entries: QueueEntry[];
  activeEntries: QueueEntry[];
  waitingEntries: QueueEntry[];
  servingEntry?: QueueEntry;
  averageWaitMinutes: number;
  dailyCustomers: number;
  missedTurnRate: number;
};

export type QueueHistoryItem = {
  id: string;
  businessName: string;
  locationName: string;
  servedAt: string;
  waitMinutes: number;
};

export type Insight = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "success" | "warning";
};

export type AdminAnalytics = {
  businesses: number;
  users: number;
  monthlyRecurringRevenueCents: number;
  fastPassRevenueCents: number;
  activeQueues: number;
  churnRiskAccounts: number;
};
