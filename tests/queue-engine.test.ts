import { describe, expect, it } from "vitest";
import {
  applyFastPass,
  calculateEstimatedWaitMinutes,
  callNext,
  getPeopleAhead
} from "@/lib/queue-engine";
import type { Queue, QueueEntry } from "@/lib/types";

const queue: Queue = {
  id: "queue",
  locationId: "location",
  name: "Walk-ins",
  status: "open",
  averageServiceMinutes: 12,
  activeStaff: 2,
  currentDemand: "normal",
  smsEnabled: true
};

function entry(id: string, position: number, status: QueueEntry["status"] = "waiting"): QueueEntry {
  return {
    id,
    queueId: "queue",
    customerId: id,
    customerName: id,
    status,
    position,
    partySize: 1,
    fastPass: false,
    quotedWaitMinutes: position * 12,
    joinedAt: `2026-06-09T20:0${position}:00-04:00`,
    updatedAt: `2026-06-09T20:0${position}:00-04:00`,
    notificationChannels: ["push"]
  };
}

describe("queue engine", () => {
  it("keeps the currently served customer ahead of Fast Pass buyers", () => {
    const entries = [entry("John", 0, "serving"), entry("Sarah", 1), entry("Mike", 2), entry("David", 3)];
    const updated = applyFastPass(entries, "David", "unlimited");

    expect(updated.map((item) => item.id)).toEqual(["John", "David", "Sarah", "Mike"]);
    expect(updated[0].status).toBe("serving");
    expect(updated[1].fastPass).toBe(true);
  });

  it("prevents Fast Pass when disabled", () => {
    expect(() => applyFastPass([entry("Maya", 1)], "Maya", "disabled")).toThrow(
      "Fast Pass is disabled"
    );
  });

  it("calculates wait time from queue length, average service time, and staff", () => {
    const entries = [entry("John", 0, "serving"), entry("Sarah", 1), entry("Mike", 2)];

    expect(calculateEstimatedWaitMinutes(queue, entries, "Mike")).toBe(12);
    expect(getPeopleAhead(entries, "Mike")).toBe(2);
  });

  it("calls next customer and marks prior serving customer as served", () => {
    const updated = callNext([entry("John", 0, "serving"), entry("Sarah", 1), entry("Mike", 2)]);

    expect(updated.find((item) => item.id === "John")?.status).toBe("served");
    expect(updated.find((item) => item.id === "Sarah")?.status).toBe("serving");
  });
});
