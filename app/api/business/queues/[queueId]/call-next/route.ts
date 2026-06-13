import { NextResponse } from "next/server";
import { getCurrentProfile, hasRole, isBusinessMember } from "@/lib/auth";
import { callNextForQueue, getQueueSnapshot, usingDemoStore } from "@/lib/data-store";
import { notifyQueueEntry } from "@/lib/services/notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await context.params;
    const currentSnapshot = await getQueueSnapshot(queueId);

    if (!usingDemoStore()) {
      const profile = await getCurrentProfile(request);
      const hasBusinessAccess =
        hasRole(profile, ["business_owner", "staff", "admin"]) &&
        (profile?.role === "admin" ||
          Boolean(profile && (await isBusinessMember(profile.id, currentSnapshot.business.id))));

      if (!hasBusinessAccess) {
        return NextResponse.json({ error: "Business owner access required." }, { status: 403 });
      }
    }

    const snapshot = await callNextForQueue(queueId);

    if (snapshot.servingEntry) {
      await notifyQueueEntry(snapshot.servingEntry, "You are next. Please come to the counter.");
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to call next customer." },
      { status: 400 }
    );
  }
}
