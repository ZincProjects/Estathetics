import { AMENITY_CATEGORIES, type AmenityCategory } from "@/lib/geo/categories";
import { listingFacts, priceLabel, psfLabel } from "@/lib/listing-format";
import type { Tables } from "@/lib/supabase/database.types";

type Listing = Tables<"listings">;
type Amenity = Pick<Tables<"listing_amenities">, "category" | "name" | "walk_minutes" | "distance_m">;

/**
 * The single source of truth an AI copywriter may draw from. Everything it writes must be
 * traceable to a line in this sheet. The unit number is deliberately excluded (privacy).
 */
export function buildFactSheet(listing: Listing, amenities: Amenity[]) {
  const lines: string[] = [];
  lines.push(`Address: ${listing.address}${listing.postal_code ? `, Singapore ${listing.postal_code}` : ""}`);
  lines.push(`Asking price: ${priceLabel(listing.asking_price)}`);
  const psf = psfLabel(listing.asking_price, listing.size_sqft);
  if (psf) lines.push(`Price per square foot: ${psf}`);
  for (const [k, v] of listingFacts(listing)) lines.push(`${k}: ${v}`);
  if (listing.facilities.length) lines.push(`Facilities: ${listing.facilities.join(", ")}`);
  if (listing.highlights) lines.push(`Agent's highlights:\n${listing.highlights.trim()}`);

  const byCat = new Map<string, Amenity[]>();
  for (const a of amenities) byCat.set(a.category, [...(byCat.get(a.category) ?? []), a]);
  if (byCat.size) {
    lines.push("Nearby (estimated walking times):");
    for (const [cat, rows] of byCat) {
      const label = AMENITY_CATEGORIES[cat as AmenityCategory]?.plural ?? cat;
      const items = rows
        .sort((a, b) => a.distance_m - b.distance_m)
        .slice(0, 4)
        .map((a) => `${a.name} (${a.walk_minutes} min walk)`);
      lines.push(`- ${label}: ${items.join("; ")}`);
    }
  }
  return lines.join("\n");
}

/** Every number written with digits, normalised ("1,001" → "1001", "4.0" → "4"). */
export function extractNumbers(text: string) {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [])
    .map((n) => n.replace(/,/g, ""))
    .map((n) => String(Number(n)))
    .filter((n) => n !== "NaN");
}

/**
 * Numbers in generated copy that don't appear in the fact sheet. Values that are part of
 * names (e.g. "EW2", "Street 44") are covered because names are in the sheet too.
 */
export function ungroundedNumbers(copy: string, factSheet: string) {
  const allowed = new Set(extractNumbers(factSheet));
  // Common, harmless numerals in prose.
  for (const n of ["1", "2", "3"]) allowed.add(n);
  return [...new Set(extractNumbers(copy).filter((n) => !allowed.has(n)))];
}
