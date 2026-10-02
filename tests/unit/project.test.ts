import { describe, expect, it } from "vitest";
import { fitWithin } from "@/lib/images/resize";
import { isOwnedPhotoPath, projectSchema } from "@/lib/schemas/project";

const user = "11111111-1111-1111-1111-111111111111";
const room = "22222222-2222-2222-2222-222222222222";
const file = "33333333-3333-3333-3333-333333333333";

describe("isOwnedPhotoPath", () => {
  it("accepts the user's own room path", () => {
    expect(isOwnedPhotoPath(`${user}/${room}/${file}.jpg`, user, room)).toBe(true);
  });
  it("rejects other users, rooms, traversal and extensions", () => {
    expect(isOwnedPhotoPath(`${room}/${room}/${file}.jpg`, user, room)).toBe(false);
    expect(isOwnedPhotoPath(`${user}/${file}/${file}.jpg`, user, room)).toBe(false);
    expect(isOwnedPhotoPath(`${user}/${room}/../x/${file}.jpg`, user, room)).toBe(false);
    expect(isOwnedPhotoPath(`${user}/${room}/${file}.png`, user, room)).toBe(false);
  });
});

describe("projectSchema", () => {
  it("turns empty optional fields into null", () => {
    const r = projectSchema.parse({ title: " Tan family ", clientName: "", propertyType: "", address: "" });
    expect(r).toEqual({ title: "Tan family", clientName: null, propertyType: null, address: null, notes: null });
  });
  it("requires a title", () => {
    expect(projectSchema.safeParse({ title: "  " }).success).toBe(false);
  });
});

describe("fitWithin", () => {
  it("downscales the long edge only", () => {
    expect(fitWithin(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fitWithin(3024, 4032, 2048)).toEqual({ width: 1536, height: 2048 });
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
  });
});
