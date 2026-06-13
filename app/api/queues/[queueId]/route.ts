import { NextResponse } from "next/server";
import { getQueueSnapshot } from "@/lib/data-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await context.params;
    return NextResponse.json({ snapshot: await getQueueSnapshot(queueId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load queue." },
      { status: 404 }
    );
  }
}
