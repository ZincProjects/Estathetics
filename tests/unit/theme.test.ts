import { describe, expect, it } from "vitest";
import { themeSchema } from "@/lib/schemas/theme";
import { PRESET_THEMES, paletteToRender } from "@/lib/themes";

describe("themeSchema", () => {
  it("parses comma/newline lists and validates hex palettes", () => {
    const r = themeSchema.parse({ name: "Kampong Calm", palette: ["#A68A64", "#ffffff"], materials: "teak, rattan\nlinen", mood: "" });
    expect(r.materials).toEqual(["teak", "rattan", "linen"]);
    expect(r.mood).toEqual([]);
  });
  it("rejects bad colours and empty materials", () => {
    expect(themeSchema.safeParse({ name: "X1", palette: ["red", "#fff"], materials: "oak" }).success).toBe(false);
    expect(themeSchema.safeParse({ name: "X1", palette: ["#000000", "#ffffff"], materials: "" }).success).toBe(false);
  });
});

describe("preset themes", () => {
  it("has the ten specified presets with valid palettes", () => {
    expect(PRESET_THEMES.map((t) => t.name)).toEqual([
      "Tech / Smart Home", "Minimalist", "Cozy Warmth", "Comfy", "Classy / Luxe",
      "Japandi", "Scandinavian", "Industrial", "Modern Tropical", "Peranakan Modern",
    ]);
    for (const t of PRESET_THEMES) expect(t.palette.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
  });
  it("derives a render palette for custom themes", () => {
    expect(paletteToRender(["#111111", "#222222"]).wall).toBe("#111111");
  });
});
