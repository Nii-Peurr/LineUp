import { NextResponse } from "next/server";
import { buyFastPass, getQueueEntry, getQueueSnapshot } from "@/lib/store";
import { createFastPassCheckoutSession } from "@/lib/services/stripe";
import { notifyQueueEntry } from "@/lib/services/notifications";
import type { QueueSnapshot } from "@/lib/types";

function getFastPassUnavailableMessage(snapshot: QueueSnapshot, entryId: string) {
  if (snapshot.business.fastPassMode === "disabled") {
    return "Fast Pass is disabled for this business.";
  }

  const waitingEntry = snapshot.waitingEntries.find((entry) => entry.id === entryId);

  if (!waitingEntry) {
    return "Only waiting customers can use Fast Pass.";
  }

  const fastPassCount = snapshot.waitingEntries.filter((entry) => entry.fastPass).length;

  if (snapshot.business.fastPassMode === "limited" && fastPassCount >= 3) {
    return "Fast Pass is temporarily sold out for this queue.";
  }

  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await context.params;

  try {
    const entry = getQueueEntry(entryId);

    if (!entry) {
      return NextResponse.json(
        {
          error: "Queue entry not found.",
          entryId,
          message:
            "Fast Pass could not be applied because this queue entry is not in the active demo store."
        },
        { status: 404 }
      );
    }

    const currentSnapshot = getQueueSnapshot(entry.queueId);
    const unavailableMessage = getFastPassUnavailableMessage(currentSnapshot, entryId);

    if (unavailableMessage) {
      return NextResponse.json(
        {
          error: unavailableMessage,
          entryId,
          message: unavailableMessage,
          snapshot: currentSnapshot
        },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const checkout = await createFastPassCheckoutSession({
      businessId: currentSnapshot.business.id,
      entryId,
      customerEmail: entry.customerEmail,
      priceCents: currentSnapshot.business.fastPassPriceCents,
      successUrl: `${origin}/customer?fastPass=success`,
      cancelUrl: `${origin}/customer?fastPass=cancelled`
    });

    if (checkout.mode === "stripe") {
      return NextResponse.json({
        checkoutUrl: checkout.url,
        snapshot: currentSnapshot
      });
    }

    const snapshot = buyFastPass(entryId);
    const promoted = snapshot.entries.find((candidate) => candidate.id === entryId);

    if (promoted) {
      await notifyQueueEntry(
        promoted,
        `Fast Pass applied. You are now position ${promoted.position}.`
      );
    }

    return NextResponse.json({
      checkoutUrl: checkout.url,
      snapshot
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply Fast Pass.";

    return NextResponse.json(
      { error: message, entryId, message },
      { status: 400 }
    );
  }
}
