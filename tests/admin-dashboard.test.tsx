import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { AdminAnalytics, Business, User } from "@/lib/types";

const analytics: AdminAnalytics = {
  businesses: 1,
  users: 1,
  monthlyRecurringRevenueCents: 4900,
  fastPassRevenueCents: 1200,
  activeQueues: 1,
  churnRiskAccounts: 0
};

const businesses: Business[] = [
  {
    id: "biz_test",
    ownerId: "user_owner",
    name: "Fade Masters",
    category: "Barbershop",
    plan: "professional",
    planStatus: "active",
    fastPassMode: "unlimited",
    fastPassPriceCents: 1200,
    monthlyCustomerLimit: null,
    revenueMonthCents: 4900
  }
];

const users: User[] = [
  {
    id: "user_admin",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin"
  }
];

describe("AdminDashboard", () => {
  it("shows a visible message when business action buttons are clicked", () => {
    render(<AdminDashboard analytics={analytics} businesses={businesses} users={users} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Manage/i })[0]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fade Masters selected for management."
    );

    fireEvent.click(screen.getByTitle("Suspend account"));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fade Masters selected for suspension review."
    );
  });

  it("shows a visible message when platform action buttons are clicked", () => {
    render(<AdminDashboard analytics={analytics} businesses={businesses} users={users} />);

    fireEvent.click(screen.getByRole("button", { name: /Manage Fast Pass Defaults/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Fast Pass defaults selected.");
  });
});
