import { describe, expect, it } from "vitest";
import { buildFactSheet, extractNumbers, ungroundedNumbers } from "@/lib/listing-facts";
import { listingCopySchema } from "@/lib/schemas/listing-copy";
import type { Tables } from "@/lib/supabase/database.types";

const listing = {
  id: "x", agent_id: "a", slug: "s", status: "draft", property_type: "hdb", title: "t",
  address: "475 Tampines Street 44", postal_code: "520475", block: "475", unit: "#08-123",
  lat: 1.36, lng: 103.95, size_sqft: 1001, bedrooms: 3, bathrooms: 2, floor_level: "High", facing: "North",
  tenure: "leasehold_99", lease_start_year: 1990, top_year: null, facilities: [], asking_price: 650000,
  highlights: "Renovated kitchen (2022)", cover_photo_path: null, view_count: 0, published_at: null,
  created_at: "", updated_at: "",
} as Tables<"listings">;
const amenities = [{ category: "mrt", name: "Tampines East MRT Station (DT33)", walk_minutes: 8, distance_m: 640 }];

describe("fact sheet", () => {
  const sheet = buildFactSheet(listing, amenities);
  it("includes facts and amenities but never the unit number", () => {
    expect(sheet).toContain("$650,000");
    expect(sheet).toContain("Tampines East MRT Station (DT33) (8 min walk)");
    expect(sheet).toContain("Renovated kitchen (2022)");
    expect(sheet).not.toContain("#08-123");
  });

  it("flags numbers that are not grounded in the facts", () => {
    const good = "Only 8 minutes' walk to Tampines East (DT33). Asking $650,000 for 1,001 sqft. Kitchen renovated in 2022.";
    expect(ungroundedNumbers(good, sheet)).toEqual([]);
    const bad = "Just 5 minutes to the MRT, with 1,200 sqft and a 2019 renovation.";
    expect(ungroundedNumbers(bad, sheet).sort()).toEqual(["1200", "2019", "5"]);
  });
});

describe("number extraction", () => {
  it("normalises commas and decimals", () => {
    expect(extractNumbers("1,001 sqft, 4.0 rooms, $650,000")).toEqual(["1001", "4", "650000"]);
  });
});

describe("listing copy schema", () => {
  it("requires the three parts", () => {
    expect(listingCopySchema.safeParse({ headline: "h", description: ["p"], key_selling_points: ["k"] }).success).toBe(true);
    expect(listingCopySchema.safeParse({ headline: "h" }).success).toBe(false);
  });
});
