import { describe, expect, it } from "vitest";
import { agentOnboardingSchema, normaliseCea, slugify } from "@/lib/schemas/profile";

describe("CEA number", () => {
  it("normalises spacing and case", () => {
    expect(normaliseCea(" r 123456a ")).toBe("R123456A");
  });
  it("accepts valid and rejects invalid numbers", () => {
    const base = { role: "agent", fullName: "Jane Tan", agencyName: "Demo Realty" };
    expect(agentOnboardingSchema.safeParse({ ...base, ceaNumber: "r123456a" }).success).toBe(true);
    expect(agentOnboardingSchema.safeParse({ ...base, ceaNumber: "R12345A" }).success).toBe(false);
    expect(agentOnboardingSchema.safeParse({ ...base, ceaNumber: "1234567A" }).success).toBe(false);
  });
});

describe("slugify", () => {
  it("creates url-safe slugs", () => {
    expect(slugify("Tan Ah Kow & Sons!", false)).toBe("tan-ah-kow-sons");
    expect(slugify("Café Déjà", false)).toBe("cafe-deja");
    expect(slugify("Jane", true)).toMatch(/^jane-[a-z0-9]{1,5}$/);
  });
});
