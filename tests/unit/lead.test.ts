import { describe, expect, it } from "vitest";
import { enquirySchema } from "@/lib/schemas/lead";

const ok = { name: "Mei Ling", email: "mei@example.com", consent: "on" };

describe("enquirySchema", () => {
  it("accepts a consented enquiry with email or phone", () => {
    expect(enquirySchema.safeParse(ok).success).toBe(true);
    expect(enquirySchema.safeParse({ name: "Raj", phone: "+65 9123 4567", consent: "on" }).success).toBe(true);
  });
  it("requires PDPA consent", () => {
    const r = enquirySchema.safeParse({ ...ok, consent: undefined });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["consent"]);
  });
  it("requires some way to contact", () => {
    expect(enquirySchema.safeParse({ name: "Raj", consent: "on" }).success).toBe(false);
  });
  it("rejects the honeypot being filled", () => {
    const r = enquirySchema.safeParse({ ...ok, company: "spam inc" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path[0] === "company")).toBe(true);
  });
});
