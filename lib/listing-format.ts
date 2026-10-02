import type { Tables } from "@/lib/supabase/database.types";
import { propertyTypeLabel } from "@/lib/constants";
import { TENURES } from "@/lib/schemas/listing";
import { formatArea, formatSgd, remainingLease, sqftToSqm } from "@/lib/units";

type Listing = Pick<
  Tables<"listings">,
  | "property_type" | "size_sqft" | "bedrooms" | "bathrooms" | "floor_level" | "facing"
  | "tenure" | "lease_start_year" | "top_year" | "asking_price"
>;

export const tenureLabel = (t: string | null) => TENURES.find((x) => x.value === t)?.label ?? null;

export function priceLabel(price: number | null) {
  return price ? formatSgd(price) : "Price on request";
}

/** Key facts as label/value pairs, in display order. Only includes facts that are set. */
export function listingFacts(l: Listing) {
  const facts: [string, string][] = [["Type", propertyTypeLabel(l.property_type)]];
  if (l.size_sqft) facts.push(["Floor area", formatArea(sqftToSqm(Number(l.size_sqft)), "sqft")]);
  if (l.bedrooms != null) facts.push(["Bedrooms", String(l.bedrooms)]);
  if (l.bathrooms != null) facts.push(["Bathrooms", String(l.bathrooms)]);
  if (l.floor_level) facts.push(["Floor", l.floor_level]);
  if (l.facing) facts.push(["Facing", l.facing]);
  const tenure = tenureLabel(l.tenure);
  if (tenure) facts.push(["Tenure", tenure]);
  if (l.lease_start_year && l.tenure?.startsWith("leasehold")) {
    const years = l.tenure === "leasehold_999" ? 999 : 99;
    facts.push(["Remaining lease", `About ${remainingLease(l.lease_start_year, years)} years`]);
  }
  if (l.top_year) facts.push(["TOP", String(l.top_year)]);
  return facts;
}

export function psfLabel(price: number | null, sqft: number | null) {
  if (!price || !sqft) return null;
  return `${formatSgd(Math.round(price / Number(sqft)))} psf`;
}
