import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyQueueEntry } from "@/lib/services/notifications";
import { getQueueEntry } from "@/lib/data-store";

const notificationSchema = z.object({
  entryId: z.string().min(1),
  message: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { entryId, message } = notificationSchema.parse(await request.json());
    const entry = await getQueueEntry(entryId);

    if (!entry) {
      return NextResponse.json({ error: "Queue entry not found." }, { status: 404 });
    }

    const results = await notifyQueueEntry(entry, message);

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send notification." },
      { status: 400 }
    );
  }
}
