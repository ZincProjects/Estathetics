import { describe, expect, it } from "vitest";
import { rankNearby } from "@/lib/geo/amenities";
import { estimateWalk, formatDistance, haversineMeters } from "@/lib/geo/distance";
import dataset from "@/data/sg-amenities.json";

const tampines = { lat: 1.36032, lng: 103.95313 }; // Blk 475 Tampines St 44

describe("distance", () => {
  it("computes haversine distance", () => {
    // Tampines MRT ↔ Bishan MRT is roughly 11.5 km
    expect(haversineMeters({ lat: 1.3533, lng: 103.9452 }, { lat: 1.3510, lng: 103.8486 }) / 1000).toBeCloseTo(10.7, 0);
  });
  it("estimates walking with a detour factor", () => {
    expect(estimateWalk(800)).toEqual({ meters: 1040, minutes: 13 });
    expect(estimateWalk(10).minutes).toBe(1);
    expect(formatDistance(1040)).toBe("1.0 km");
    expect(formatDistance(347)).toBe("350 m");
  });
});

describe("rankNearby", () => {
  const station = (name: string, lat: number, lng: number) => ({ name, lat, lng, source: "dataset" as const });
  it("keeps the nearest within radius, de-duplicated, up to the limit", () => {
    const r = rankNearby(tampines, "mrt", [
      station("Far Station", 1.45, 103.8),
      station("Near", 1.3605, 103.9535),
      station("near", 1.3606, 103.9536),
      station("Mid", 1.355, 103.95),
    ]);
    expect(r.map((x) => x.name)).toEqual(["Near", "Mid"]);
    expect(r[0].walkMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe("bundled amenity dataset", () => {
  it("finds real MRT stations near a Tampines HDB block", () => {
    const mrt = dataset.amenities.filter((a) => a.c === "mrt").map((a) => ({ name: a.n, lat: a.lat, lng: a.lng, source: "dataset" as const }));
    const names = rankNearby(tampines, "mrt", mrt).map((s) => s.name);
    expect(names.some((n) => n.startsWith("Tampines"))).toBe(true);
  });
  it("has the core categories", () => {
    const cats = new Set(dataset.amenities.map((a) => a.c));
    for (const c of ["mrt", "hawker", "primary_school", "mall", "hospital"]) expect(cats.has(c)).toBe(true);
  });
});
