import { NextResponse } from "next/server";
import { z } from "zod";
import { updateQueueStatus } from "@/lib/store";

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
    const snapshot = updateQueueStatus(queueId, status);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update queue status." },
      { status: 400 }
    );
  }
}
