import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorResponse } from "@/lib/ai/http";
import { generateListingCopy } from "@/lib/ai/listing-copy";
import { assertWithinRateLimit, recordUsage } from "@/lib/ai/usage";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const bodySchema = z.object({ tone: z.enum(["professional", "warm", "luxury", "punchy"]) });

export async function POST(request: Request, ctx: RouteContext<"/api/listings/[listingId]/copy">) {
  const profile = await getProfile();
  if (!profile || profile.role !== "agent") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a tone" }, { status: 400 });
  const { listingId } = await ctx.params;

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_amenities(category, name, walk_minutes, distance_m)")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  try {
    await assertWithinRateLimit(supabase, "listing_copy");
    const { listing_amenities: amenities, ...row } = listing;
    const result = await generateListingCopy({ listing: row, amenities, tone: parsed.data.tone });

    await supabase.from("listing_content").update({ is_current: false }).eq("listing_id", listing.id).eq("kind", "listing_copy");
    const { error } = await supabase.from("listing_content").insert({
      listing_id: listing.id,
      kind: "listing_copy",
      tone: parsed.data.tone,
      data: { ...result.copy, warnings: result.warnings, model: result.model },
      prompt_version: result.promptVersion,
      is_current: true,
    });
    if (error) throw error;

    await recordUsage(supabase, profile.id, "listing_copy", { usage: result.usage, mocked: result.mocked, meta: { listing_id: listing.id } });
    return NextResponse.json({ copy: result.copy, warnings: result.warnings, mocked: result.mocked });
  } catch (e) {
    return aiErrorResponse(e, "writing the listing copy");
  }
}
