import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getQueueEntry,
  leaveQueueByEntry,
  markQueueEntryServed,
  skipQueueEntry
} from "@/lib/store";
import { notifyQueueEntry } from "@/lib/services/notifications";

const actionSchema = z.object({
  action: z.enum(["leave", "skip", "served"])
});

async function mutate(
  request: Request,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await context.params;
    const { action } = actionSchema.parse(await request.json());
    const entry = getQueueEntry(entryId);

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found." }, { status: 404 });
    }

    const snapshot =
      action === "leave"
        ? leaveQueueByEntry(entryId)
        : action === "skip"
          ? skipQueueEntry(entryId)
          : markQueueEntryServed(entryId);

    if (action === "skip") {
      await notifyQueueEntry(entry, "Your turn was skipped. Please check in with the business.");
    }

    if (action === "served") {
      await notifyQueueEntry(entry, "Thanks for visiting. Your queue visit is complete.");
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update queue entry." },
      { status: 400 }
    );
  }
}

export const PATCH = mutate;
export const POST = mutate;
