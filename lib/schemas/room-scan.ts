import { z } from "zod";

/**
 * AI Room Scan output. Kept to JSON-Schema-friendly constructs (no regex/refinements)
 * so the same schema drives Claude's structured output and our validation.
 */
export const CONSTRAINT_TYPES = [
  "beam",
  "column",
  "bomb_shelter",
  "db_box",
  "aircon_trunking",
  "aircon_unit",
  "pipe",
  "window_grille",
  "uneven_wall",
  "other",
] as const;

export const roomScanSchema = z.object({
  room_type: z.string().describe("e.g. living room, master bedroom, kitchen"),
  summary: z.string().describe("Two or three sentences describing the room as a designer would."),
  dimensions: z.object({
    length_m: z.number().nullable().describe("Longer floor dimension in metres, estimated"),
    width_m: z.number().nullable().describe("Shorter floor dimension in metres, estimated"),
    area_sqm: z.number().nullable(),
    ceiling_height_m: z.number().nullable(),
    confidence: z.enum(["low", "medium", "high"]),
    basis: z.string().describe("Which visual references the estimate is based on, e.g. standard door height 2.1m"),
  }),
  natural_light: z.object({
    direction: z.string().describe("Where light enters from relative to the camera, e.g. 'left wall, full-height window'"),
    level: z.enum(["dim", "moderate", "bright"]),
    notes: z.string(),
  }),
  windows: z.array(
    z.object({
      location: z.string(),
      type: z.string().describe("e.g. casement, sliding, bay, full-height"),
      approx_width_m: z.number().nullable(),
      notes: z.string(),
    }),
  ),
  doors: z.array(z.object({ location: z.string(), type: z.string(), notes: z.string() })),
  flooring: z.object({ material: z.string(), condition: z.string() }),
  walls: z.object({ material: z.string(), colour: z.string(), condition: z.string() }),
  ceiling: z.object({ type: z.string(), notes: z.string() }),
  existing_furniture: z.array(
    z.object({
      item: z.string(),
      recommendation: z.enum(["keep", "replace", "rework", "unsure"]),
      notes: z.string(),
    }),
  ),
  fixtures: z.array(z.string()).describe("Built-in fixtures: lights, switches, aircon, cabinets, ceiling fan…"),
  constraints: z.array(
    z.object({
      type: z.enum(CONSTRAINT_TYPES),
      description: z.string(),
      location: z.string(),
      design_impact: z.string(),
    }),
  ),
  opportunities: z.array(z.string()),
  photo_quality: z.object({
    usable: z.boolean(),
    issues: z.array(z.string()).describe("e.g. too dark, partial view, wide-angle distortion"),
  }),
});

export type RoomScan = z.infer<typeof roomScanSchema>;

export const CONSTRAINT_LABELS: Record<(typeof CONSTRAINT_TYPES)[number], string> = {
  beam: "Beam",
  column: "Column",
  bomb_shelter: "Household shelter (bomb shelter)",
  db_box: "DB box",
  aircon_trunking: "Aircon trunking",
  aircon_unit: "Aircon unit",
  pipe: "Pipe / riser",
  window_grille: "Window grille",
  uneven_wall: "Uneven wall",
  other: "Other",
};
