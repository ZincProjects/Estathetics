import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { mockRedesignProvider } from "@/lib/ai/redesign/mock";
import { watermark } from "@/lib/images/watermark";
import { prompts } from "@/lib/prompts";
import { mockRoomScan } from "@/lib/ai/mocks/room-scan";

const photo = readFileSync("public/mock/room-living.jpg");

describe("watermark", () => {
  it("keeps dimensions and changes the bottom-left corner", async () => {
    const out = await watermark(photo);
    const [a, b] = await Promise.all([sharp(photo).metadata(), sharp(out).metadata()]);
    expect([b.width, b.height]).toEqual([a.width, a.height]);
    const region = { left: 60, top: (b.height ?? 0) - 70, width: 40, height: 20 };
    const [before, after] = await Promise.all([
      sharp(photo).extract(region).raw().toBuffer(),
      sharp(out).extract(region).raw().toBuffer(),
    ]);
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  it("downscales to maxEdge", async () => {
    const out = await watermark(photo, { maxEdge: 600 });
    const m = await sharp(out).metadata();
    expect(Math.max(m.width ?? 0, m.height ?? 0)).toBe(600);
  });
});

describe("mock redesign provider", () => {
  it("returns an image with the same aspect ratio as the original", async () => {
    const r = await mockRedesignProvider.generate({
      image: photo, prompt: "", negativePrompt: "", strength: 0.8, seed: 2, palette: ["#112233", "#445566"], themeSlug: "t",
    });
    const [a, b] = await Promise.all([sharp(photo).metadata(), sharp(r.image).metadata()]);
    expect((b.width ?? 0) / (b.height ?? 1)).toBeCloseTo((a.width ?? 0) / (a.height ?? 1), 2);
  });
});

describe("redesign prompt", () => {
  it("includes theme, palette and structural elements from the scan", () => {
    const text = prompts.redesign.build({
      roomType: "Living room", themeName: "Japandi", materials: ["light oak"], mood: ["serene"],
      palette: ["#ece6dc"], scan: mockRoomScan("living"), variation: 1,
    });
    expect(text).toContain("Japandi");
    expect(text).toContain("#ece6dc");
    expect(text).toMatch(/keep existing .*window/);
    expect(text).toMatch(/beam/);
  });
});
