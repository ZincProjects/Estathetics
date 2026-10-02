import type { RoomScan } from "@/lib/schemas/room-scan";

/**
 * Image prompt builder for structure-preserving redesigns, v1.
 * Image models respond best to dense, comma-separated descriptions, so this is a
 * template rather than an instruction prompt.
 */
export const redesignV1 = {
  id: "redesign",
  version: "redesign@1",
  negative:
    "different room layout, moved windows, moved doors, changed walls, changed camera angle, fisheye, warped lines, people, text, watermark, logo, clutter, lowres, blurry, cartoon, illustration, deformed furniture",
  build(ctx: {
    roomType: string;
    themeName: string;
    themeDescription?: string | null;
    materials: string[];
    mood: string[];
    palette: string[];
    scan?: RoomScan | null;
    notes?: string | null;
    variation: number;
  }) {
    const keep: string[] = [];
    if (ctx.scan) {
      for (const w of ctx.scan.windows) keep.push(`${w.type} window on the ${w.location}`);
      for (const d of ctx.scan.doors) keep.push(`door on the ${d.location}`);
      for (const c of ctx.scan.constraints) {
        if (["beam", "column", "bomb_shelter"].includes(c.type)) keep.push(`${c.type.replace("_", " ")} at ${c.location}`);
      }
    }
    // Small, deterministic variety between variations without changing the theme.
    const angle = [
      "balanced symmetrical arrangement",
      "relaxed asymmetric arrangement",
      "layered textures and statement lighting",
      "airy minimal arrangement with negative space",
    ][(ctx.variation - 1) % 4];

    return [
      `professional interior design photograph of a ${ctx.roomType} in ${ctx.themeName} style`,
      ctx.themeDescription ?? "",
      `materials: ${ctx.materials.join(", ")}`,
      `colour palette ${ctx.palette.join(" ")}`,
      ctx.mood.length ? `mood: ${ctx.mood.join(", ")}` : "",
      angle,
      ctx.notes ? `designer notes: ${ctx.notes}` : "",
      keep.length ? `keep existing ${keep.join(", ")}` : "",
      "Singapore apartment, natural daylight, realistic proportions, architectural digest quality, 8k, sharp focus",
    ]
      .filter(Boolean)
      .join(", ");
  },
} as const;
