import { NextResponse } from "next/server";
import { z } from "zod";
import { getQueueSnapshot, joinQueue } from "@/lib/data-store";
import { notifyQueueEntry } from "@/lib/services/notifications";

const joinSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  channels: z.array(z.enum(["push", "sms", "email"])).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await context.params;
    const payload = joinSchema.parse(await request.json());
    const entry = await joinQueue({ queueId, ...payload });
    const snapshot = await getQueueSnapshot(queueId);
    await notifyQueueEntry(
      entry,
      `You joined ${snapshot.business.name}. You are position ${entry.position}.`
    );

    return NextResponse.json({ entry, snapshot }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to join queue." },
      { status: 400 }
    );
  }
}
