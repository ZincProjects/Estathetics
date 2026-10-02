import { NextResponse } from "next/server";
import { findNearbyAmenities } from "@/lib/geo/amenities";
import { aiErrorResponse } from "@/lib/ai/http";
import { assertWithinRateLimit, recordUsage } from "@/lib/ai/usage";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/** (Re)builds the neighbourhood report for a listing and caches it in listing_amenities. */
export async function POST(_: Request, ctx: RouteContext<"/api/listings/[listingId]/neighbourhood">) {
  const profile = await getProfile();
  if (!profile || profile.role !== "agent") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { listingId } = await ctx.params;

  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("id, lat, lng").eq("id", listingId).maybeSingle();
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.lat == null || listing.lng == null) {
    return NextResponse.json({ error: "Pin the address first: edit the listing and pick it from the address search." }, { status: 400 });
  }

  try {
    await assertWithinRateLimit(supabase, "neighbourhood");
    const { amenities, sources } = await findNearbyAmenities({ lat: listing.lat, lng: listing.lng });

    await supabase.from("listing_amenities").delete().eq("listing_id", listing.id);
    if (amenities.length) {
      const { error } = await supabase.from("listing_amenities").insert(
        amenities.map((a) => ({
          listing_id: listing.id,
          category: a.category,
          name: a.name,
          lat: a.lat,
          lng: a.lng,
          distance_m: a.distanceM,
          walk_minutes: a.walkMinutes,
          source: a.source,
        })),
      );
      if (error) throw error;
    }
    await recordUsage(supabase, profile.id, "neighbourhood", { mocked: false, meta: { listing_id: listing.id, sources } });
    return NextResponse.json({ count: amenities.length, sources });
  } catch (e) {
    return aiErrorResponse(e, "building the neighbourhood report");
  }
}
