import { z } from "zod";

const list = (max: number, itemMax = 40) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(itemMax)).max(max));

export const HEX = /^#[0-9a-f]{6}$/i;

export const themeSchema = z.object({
  name: z.string().trim().min(2, "Name your theme").max(80),
  description: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((v) => v || null),
  palette: z
    .array(z.string().regex(HEX, "Colours must be hex codes like #A68A64"))
    .min(2, "Pick at least 2 colours")
    .max(8, "Up to 8 colours"),
  materials: list(12).pipe(z.array(z.string()).min(1, "Add at least one material")),
  mood: list(12, 30),
});

export type ThemeInput = z.output<typeof themeSchema>;
