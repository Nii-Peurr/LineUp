import { NextResponse } from "next/server";
import { z } from "zod";
import { predictWaitTime } from "@/lib/services/openai";
import { getQueueSnapshot } from "@/lib/data-store";

const schema = z.object({
  queueId: z.string().min(1).default("queue_greenbelt_walkins")
});

export async function POST(request: Request) {
  try {
    const { queueId } = schema.parse(await request.json());
    const prediction = await predictWaitTime(await getQueueSnapshot(queueId));

    return NextResponse.json(prediction);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to predict wait time." },
      { status: 400 }
    );
  }
}
