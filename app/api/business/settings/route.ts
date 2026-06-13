import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile, hasRole, isBusinessMember } from "@/lib/auth";
import { updateBusinessSettings, usingDemoStore } from "@/lib/data-store";

const settingsSchema = z.object({
  businessId: z.string().min(1),
  locationId: z.string().min(1),
  queueId: z.string().min(1),
  businessName: z.string().min(1),
  locationName: z.string().min(1),
  locationAddress: z.string().min(1),
  queueName: z.string().min(1),
  averageServiceMinutes: z.number().int().min(1).max(120),
  fastPassEnabled: z.boolean(),
  fastPassPriceCents: z.number().int().min(0)
});

export async function PATCH(request: Request) {
  try {
    const input = settingsSchema.parse(await request.json());

    if (!usingDemoStore()) {
      const profile = await getCurrentProfile(request);
      const hasBusinessAccess =
        hasRole(profile, ["business_owner", "admin"]) &&
        (profile?.role === "admin" ||
          Boolean(profile && (await isBusinessMember(profile.id, input.businessId))));

      if (!hasBusinessAccess) {
        return NextResponse.json({ error: "Business owner access required." }, { status: 403 });
      }
    }

    const dashboard = await updateBusinessSettings(input);

    return NextResponse.json({ dashboard });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update settings." },
      { status: 400 }
    );
  }
}
