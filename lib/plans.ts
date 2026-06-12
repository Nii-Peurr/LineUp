import type { PlanId } from "@/lib/types";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  stripeLookupKey?: string;
  features: string[];
  limits: {
    locations: number | "unlimited";
    customersPerMonth: number | "unlimited";
    sms: boolean;
    analytics: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
};

export const plans: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "Free",
    features: ["One location", "100 customers/month", "Email notifications"],
    limits: {
      locations: 1,
      customersPerMonth: 100,
      sms: false,
      analytics: false,
      apiAccess: false,
      whiteLabel: false
    }
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "$49/month",
    stripeLookupKey: "lineup_professional_monthly",
    features: [
      "Unlimited customers",
      "SMS notifications",
      "Analytics",
      "Fast Pass pricing"
    ],
    limits: {
      locations: 1,
      customersPerMonth: "unlimited",
      sms: true,
      analytics: true,
      apiAccess: false,
      whiteLabel: false
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    stripeLookupKey: "lineup_enterprise_monthly",
    features: ["Multiple locations", "API access", "White-label", "Priority support"],
    limits: {
      locations: "unlimited",
      customersPerMonth: "unlimited",
      sms: true,
      analytics: true,
      apiAccess: true,
      whiteLabel: true
    }
  }
];

export function getPlan(planId: PlanId) {
  const plan = plans.find((candidate) => candidate.id === planId);

  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  return plan;
}
