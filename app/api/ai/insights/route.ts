import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBusinessInsights } from "@/lib/services/openai";
import { getQueueSnapshot } from "@/lib/store";

const schema = z.object({
  queueId: z.string().min(1).default("queue_greenbelt_walkins")
});

export async function POST(request: Request) {
  try {
    const { queueId } = schema.parse(await request.json());
    const insights = await generateBusinessInsights(getQueueSnapshot(queueId));

    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate insights." },
      { status: 400 }
    );
  }
}
