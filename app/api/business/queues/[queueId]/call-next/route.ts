import { NextResponse } from "next/server";
import { callNextForQueue } from "@/lib/store";
import { notifyQueueEntry } from "@/lib/services/notifications";

export async function POST(
  _request: Request,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await context.params;
    const snapshot = callNextForQueue(queueId);

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
