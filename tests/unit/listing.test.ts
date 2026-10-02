import { describe, expect, it } from "vitest";
import { listingFacts, priceLabel, psfLabel } from "@/lib/listing-format";
import { listingSchema, normaliseListing } from "@/lib/schemas/listing";

const base = {
  propertyType: "hdb",
  title: "Bright 4-room near MRT",
  address: "475 Tampines Street 44",
  postalCode: "520475",
  sizeValue: "93",
  sizeUnit: "sqm",
  bedrooms: "3",
  bathrooms: "2",
  leaseStartYear: "1990",
  askingPrice: "650000",
  lat: "1.3603",
  lng: "103.9531",
};

describe("listingSchema", () => {
  it("converts sqm to sqft and coerces numbers", () => {
    const r = listingSchema.parse(base);
    expect(r.sizeSqft).toBe(1001);
    expect(r.bedrooms).toBe(3);
    expect(r.askingPrice).toBe(650000);
    expect(r.lat).toBeCloseTo(1.3603);
  });
  it("treats blank optionals as null", () => {
    const r = listingSchema.parse({ ...base, bedrooms: "", askingPrice: "", postalCode: "", lat: "", lng: "" });
    expect(r.bedrooms).toBeNull();
    expect(r.askingPrice).toBeNull();
    expect(r.postalCode).toBeNull();
    expect(r.lat).toBeUndefined();
  });
  it("rejects bad postal codes and coordinates outside Singapore", () => {
    expect(listingSchema.safeParse({ ...base, postalCode: "1234" }).success).toBe(false);
    expect(listingSchema.safeParse({ ...base, lat: "51.5" }).success).toBe(false);
  });
  it("forces HDB to 99-year leasehold with no condo facilities", () => {
    const r = normaliseListing(listingSchema.parse({ ...base, tenure: "freehold", facilities: ["Gym"] }));
    expect(r.tenure).toBe("leasehold_99");
    expect(r.facilities).toEqual([]);
  });
});

describe("listing format", () => {
  it("formats price, psf and facts", () => {
    expect(priceLabel(null)).toBe("Price on request");
    expect(psfLabel(650000, 1001)).toBe("$649 psf");
    const facts = Object.fromEntries(
      listingFacts({ property_type: "hdb", size_sqft: 1001, bedrooms: 3, bathrooms: 2, floor_level: null, facing: null, tenure: "leasehold_99", lease_start_year: 1990, top_year: null, asking_price: 650000 }),
    );
    expect(facts.Type).toBe("HDB");
    expect(facts["Floor area"]).toBe("1,001 sqft (93 sqm)");
    expect(facts["Remaining lease"]).toMatch(/^About \d+ years$/);
  });
});
