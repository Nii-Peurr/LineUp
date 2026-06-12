import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/queue-entries/[entryId]/fast-pass/route";
import {
  getQueueEntry,
  joinQueue,
  leaveQueueByEntry,
  resetDemoStoreForTests
} from "@/lib/store";
import type { QueueSnapshot } from "@/lib/types";

function requestFor(entryId: string) {
  return new Request(`http://localhost/api/queue-entries/${entryId}/fast-pass`, {
    method: "POST"
  });
}

function contextFor(entryId: string) {
  return {
    params: Promise.resolve({ entryId })
  };
}

describe("Fast Pass route", () => {
  beforeEach(() => {
    resetDemoStoreForTests();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
  });

  it("applies Fast Pass to a seed demo entry", async () => {
    const response = await POST(requestFor("entry_3"), contextFor("entry_3"));
    const body = (await response.json()) as { snapshot: QueueSnapshot };
    const promoted = body.snapshot.entries.find((entry) => entry.id === "entry_3");

    expect(response.status).toBe(200);
    expect(promoted?.fastPass).toBe(true);
  });

  it("applies Fast Pass to a newly joined entry", async () => {
    const entry = joinQueue({
      queueId: "queue_greenbelt_walkins",
      customerName: "New Fast Pass Customer",
      customerEmail: "new-fast-pass@example.com",
      customerPhone: "+12025550199"
    });

    expect(getQueueEntry(entry.id)).toBeTruthy();

    const response = await POST(requestFor(entry.id), contextFor(entry.id));
    const body = (await response.json()) as { snapshot: QueueSnapshot };
    const promoted = body.snapshot.entries.find((candidate) => candidate.id === entry.id);

    expect(response.status).toBe(200);
    expect(promoted?.fastPass).toBe(true);
  });

  it("rejects Fast Pass when the entry is not actively waiting", async () => {
    const entry = joinQueue({
      queueId: "queue_greenbelt_walkins",
      customerName: "Left Fast Pass Customer",
      customerEmail: "left-fast-pass@example.com",
      customerPhone: "+12025550198"
    });
    leaveQueueByEntry(entry.id);

    const response = await POST(requestFor(entry.id), contextFor(entry.id));
    const body = (await response.json()) as {
      error: string;
      entryId: string;
      message: string;
    };

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: "Only waiting customers can use Fast Pass.",
      entryId: entry.id,
      message: "Only waiting customers can use Fast Pass."
    });
  });

  it("returns useful JSON when an entry is not found", async () => {
    const response = await POST(requestFor("entry_missing"), contextFor("entry_missing"));
    const body = (await response.json()) as { error: string; entryId: string; message: string };

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      error: "Queue entry not found.",
      entryId: "entry_missing"
    });
    expect(body.message).toContain("active demo store");
  });
});
