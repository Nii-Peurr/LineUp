import type {
  AdminAnalytics,
  Business,
  BusinessHours,
  Insight,
  Location,
  Queue,
  QueueEntry,
  QueueHistoryItem,
  StaffMember,
  User
} from "@/lib/types";

const weekdayHours: BusinessHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: day === 0 ? "10:00" : "09:00",
  close: day === 0 ? "16:00" : "19:00",
  closed: false
}));

export const users: User[] = [
  {
    id: "user_customer_1",
    name: "Maya Johnson",
    email: "maya@example.com",
    phone: "+12025550112",
    role: "customer",
    avatarColor: "#0f766e"
  },
  {
    id: "user_customer_2",
    name: "John Carter",
    email: "john@example.com",
    phone: "+12025550113",
    role: "customer",
    avatarColor: "#2563eb"
  },
  {
    id: "user_owner_1",
    name: "Andre Lewis",
    email: "andre@fademasters.example",
    role: "business_owner",
    avatarColor: "#111827"
  },
  {
    id: "user_admin_1",
    name: "Ava Chen",
    email: "admin@lineup.example",
    role: "admin",
    avatarColor: "#7c2d12"
  }
];

export const businesses: Business[] = [
  {
    id: "biz_fade_masters",
    ownerId: "user_owner_1",
    name: "Fade Masters",
    category: "Barbershop",
    plan: "professional",
    planStatus: "active",
    fastPassMode: "limited",
    fastPassPriceCents: 1200,
    monthlyCustomerLimit: null,
    stripeCustomerId: "cus_demo_fade",
    revenueMonthCents: 392000
  },
  {
    id: "biz_citycare",
    ownerId: "user_owner_1",
    name: "CityCare Clinic",
    category: "Clinic",
    plan: "enterprise",
    planStatus: "active",
    fastPassMode: "disabled",
    fastPassPriceCents: 0,
    monthlyCustomerLimit: null,
    revenueMonthCents: 1289000
  },
  {
    id: "biz_lacquer",
    ownerId: "user_owner_1",
    name: "Lacquer Room",
    category: "Nail salon",
    plan: "starter",
    planStatus: "trialing",
    fastPassMode: "unlimited",
    fastPassPriceCents: 800,
    monthlyCustomerLimit: 100,
    revenueMonthCents: 44000
  }
];

export const locations: Location[] = [
  {
    id: "loc_greenbelt",
    businessId: "biz_fade_masters",
    name: "Greenbelt",
    address: "7500 Greenway Center Dr, Greenbelt, MD",
    timezone: "America/New_York",
    phone: "+13015550100",
    hours: weekdayHours
  },
  {
    id: "loc_bowie",
    businessId: "biz_fade_masters",
    name: "Bowie",
    address: "15500 Annapolis Rd, Bowie, MD",
    timezone: "America/New_York",
    phone: "+13015550101",
    hours: weekdayHours
  },
  {
    id: "loc_baltimore",
    businessId: "biz_fade_masters",
    name: "Baltimore",
    address: "301 W Lexington St, Baltimore, MD",
    timezone: "America/New_York",
    phone: "+14105550102",
    hours: weekdayHours
  },
  {
    id: "loc_citycare_main",
    businessId: "biz_citycare",
    name: "Downtown",
    address: "100 Civic Plaza, Washington, DC",
    timezone: "America/New_York",
    phone: "+12025550104",
    hours: weekdayHours
  }
];

export const staff: StaffMember[] = [
  {
    id: "staff_1",
    locationId: "loc_greenbelt",
    name: "Andre",
    role: "Master barber",
    active: true
  },
  {
    id: "staff_2",
    locationId: "loc_greenbelt",
    name: "Nia",
    role: "Stylist",
    active: true
  },
  {
    id: "staff_3",
    locationId: "loc_greenbelt",
    name: "Theo",
    role: "Barber",
    active: false
  }
];

export const queues: Queue[] = [
  {
    id: "queue_greenbelt_walkins",
    locationId: "loc_greenbelt",
    name: "Walk-ins",
    status: "open",
    averageServiceMinutes: 16,
    activeStaff: 2,
    currentDemand: "heavy",
    smsEnabled: true
  },
  {
    id: "queue_bowie_walkins",
    locationId: "loc_bowie",
    name: "Walk-ins",
    status: "open",
    averageServiceMinutes: 14,
    activeStaff: 1,
    currentDemand: "normal",
    smsEnabled: true
  },
  {
    id: "queue_citycare_checkin",
    locationId: "loc_citycare_main",
    name: "Check-in",
    status: "paused",
    averageServiceMinutes: 22,
    activeStaff: 4,
    currentDemand: "normal",
    smsEnabled: false
  }
];

const now = new Date("2026-06-09T22:00:00-04:00").toISOString();

export const queueEntries: QueueEntry[] = [
  {
    id: "entry_serving_1",
    queueId: "queue_greenbelt_walkins",
    customerId: "user_customer_2",
    customerName: "John Carter",
    customerPhone: "+12025550113",
    customerEmail: "john@example.com",
    status: "serving",
    position: 0,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 0,
    joinedAt: "2026-06-09T21:20:00-04:00",
    updatedAt: now,
    notificationChannels: ["push", "sms", "email"]
  },
  {
    id: "entry_1",
    queueId: "queue_greenbelt_walkins",
    customerId: "user_queue_1",
    customerName: "Sarah Miles",
    customerPhone: "+12025550114",
    customerEmail: "sarah@example.com",
    status: "waiting",
    position: 1,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 8,
    joinedAt: "2026-06-09T21:32:00-04:00",
    updatedAt: now,
    notificationChannels: ["push", "sms"]
  },
  {
    id: "entry_2",
    queueId: "queue_greenbelt_walkins",
    customerId: "user_queue_2",
    customerName: "Mike Evans",
    customerPhone: "+12025550115",
    customerEmail: "mike@example.com",
    status: "waiting",
    position: 2,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 16,
    joinedAt: "2026-06-09T21:35:00-04:00",
    updatedAt: now,
    notificationChannels: ["push"]
  },
  {
    id: "entry_3",
    queueId: "queue_greenbelt_walkins",
    customerId: "user_customer_1",
    customerName: "Maya Johnson",
    customerPhone: "+12025550112",
    customerEmail: "maya@example.com",
    status: "waiting",
    position: 3,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 24,
    joinedAt: "2026-06-09T21:42:00-04:00",
    updatedAt: now,
    notificationChannels: ["push", "sms", "email"]
  },
  {
    id: "entry_4",
    queueId: "queue_greenbelt_walkins",
    customerId: "user_queue_4",
    customerName: "David Kim",
    customerPhone: "+12025550118",
    customerEmail: "david@example.com",
    status: "waiting",
    position: 4,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 32,
    joinedAt: "2026-06-09T21:48:00-04:00",
    updatedAt: now,
    notificationChannels: ["sms", "email"]
  },
  {
    id: "entry_bowie_1",
    queueId: "queue_bowie_walkins",
    customerId: "user_queue_5",
    customerName: "Alex Rivera",
    customerPhone: "+12025550119",
    customerEmail: "alex@example.com",
    status: "waiting",
    position: 1,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: 14,
    joinedAt: "2026-06-09T21:50:00-04:00",
    updatedAt: now,
    notificationChannels: ["push", "sms"]
  }
];

export const queueHistory: QueueHistoryItem[] = [
  {
    id: "hist_1",
    businessName: "Fade Masters",
    locationName: "Greenbelt",
    servedAt: "2026-06-06T18:20:00-04:00",
    waitMinutes: 18
  },
  {
    id: "hist_2",
    businessName: "CityCare Clinic",
    locationName: "Downtown",
    servedAt: "2026-05-28T09:45:00-04:00",
    waitMinutes: 31
  }
];

export const insights: Insight[] = [
  {
    id: "insight_1",
    title: "Friday rush window",
    body: "Fridays between 4PM and 7PM are your busiest hours. Add one more active staff member to reduce waits by roughly 9 minutes.",
    severity: "info"
  },
  {
    id: "insight_2",
    title: "Abandonment threshold",
    body: "You lose 22% of customers after 25 minutes. Send a 3-people-away SMS earlier during heavy demand.",
    severity: "warning"
  },
  {
    id: "insight_3",
    title: "Fast Pass conversion",
    body: "Fast Pass is converting at 11.4% today and added $264 in incremental revenue.",
    severity: "success"
  }
];

export const adminAnalytics: AdminAnalytics = {
  businesses: 1284,
  users: 84210,
  monthlyRecurringRevenueCents: 39120000,
  fastPassRevenueCents: 4884000,
  activeQueues: 4822,
  churnRiskAccounts: 34
};
