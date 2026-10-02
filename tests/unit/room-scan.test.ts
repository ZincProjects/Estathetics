import { describe, expect, it } from "vitest";
import { mockRoomScan } from "@/lib/ai/mocks/room-scan";
import { prompts } from "@/lib/prompts";
import { roomScanSchema } from "@/lib/schemas/room-scan";
import { formatArea, formatLength, formatSgd, remainingLease, sqftToSqm, sqmToSqft } from "@/lib/units";

describe("room scan mocks", () => {
  it.each(["living", "master_bedroom", "kitchen", null])("mock for %s matches the schema", (t) => {
    expect(roomScanSchema.safeParse(mockRoomScan(t)).success).toBe(true);
  });
  it("rejects unknown constraint types", () => {
    const bad = { ...mockRoomScan("living"), constraints: [{ type: "lava", description: "", location: "", design_impact: "" }] };
    expect(roomScanSchema.safeParse(bad).success).toBe(false);
  });
});

describe("room scan prompt", () => {
  it("is versioned and mentions verification of estimates", () => {
    expect(prompts.roomScan.version).toMatch(/^room-scan@\d+$/);
    expect(prompts.roomScan.system).toMatch(/estimate/i);
    expect(prompts.roomScan.user({ roomName: "Living", propertyType: "HDB" })).toContain("HDB");
  });
});

describe("units", () => {
  it("converts area both ways", () => {
    expect(sqmToSqft(100)).toBeCloseTo(1076.39, 1);
    expect(sqftToSqm(1076.39)).toBeCloseTo(100, 1);
    expect(formatArea(19)).toBe("19 sqm (205 sqft)");
    expect(formatArea(null)).toBe("—");
  });
  it("formats lengths in metres and feet", () => {
    expect(formatLength(2.6)).toBe("2.6 m (8′6″)");
  });
  it("formats SGD and remaining lease", () => {
    expect(formatSgd(650000)).toBe("$650,000");
    expect(remainingLease(1990, 99, new Date("2026-06-01"))).toBe(63);
  });
});
