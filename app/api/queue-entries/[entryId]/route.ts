import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getQueueSnapshot,
  getQueueEntry,
  leaveQueueByEntry,
  markQueueEntryServed,
  skipQueueEntry,
  usingDemoStore
} from "@/lib/data-store";
import { getCurrentProfile, hasRole, isBusinessMember } from "@/lib/auth";
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
    const entry = await getQueueEntry(entryId);

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found." }, { status: 404 });
    }

    if (!usingDemoStore() && action !== "leave") {
      const snapshot = await getQueueSnapshot(entry.queueId);
      const profile = await getCurrentProfile(request);
      const hasBusinessAccess =
        hasRole(profile, ["business_owner", "staff", "admin"]) &&
        (profile?.role === "admin" ||
          Boolean(profile && (await isBusinessMember(profile.id, snapshot.business.id))));

      if (!hasBusinessAccess) {
        return NextResponse.json({ error: "Business owner access required." }, { status: 403 });
      }
    }

    const snapshot =
      action === "leave"
        ? await leaveQueueByEntry(entryId)
        : action === "skip"
          ? await skipQueueEntry(entryId)
          : await markQueueEntryServed(entryId);

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
