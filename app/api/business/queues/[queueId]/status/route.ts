import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile, hasRole, isBusinessMember } from "@/lib/auth";
import { getQueueSnapshot, updateQueueStatus, usingDemoStore } from "@/lib/data-store";

const statusSchema = z.object({
  status: z.enum(["open", "paused", "closed"])
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await context.params;
    const { status } = statusSchema.parse(await request.json());
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

    const snapshot = updateQueueStatus(queueId, status);

    return NextResponse.json({ snapshot: await snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update queue status." },
      { status: 400 }
    );
  }
}
