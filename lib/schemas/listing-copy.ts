import { z } from "zod";

export const TONES = [
  { value: "professional", label: "Professional", hint: "Clear, credible, factual" },
  { value: "warm", label: "Warm", hint: "Family-friendly, inviting" },
  { value: "luxury", label: "Luxury", hint: "Refined, aspirational" },
  { value: "punchy", label: "Punchy", hint: "Short, energetic, social-ready" },
] as const;

export type Tone = (typeof TONES)[number]["value"];

export const listingCopySchema = z.object({
  headline: z.string().describe("Under 90 characters. No emojis."),
  description: z.array(z.string()).describe("2-4 short paragraphs of listing description."),
  key_selling_points: z.array(z.string()).describe("4-7 concise bullet points, each grounded in the fact sheet."),
});

export type ListingCopy = z.infer<typeof listingCopySchema>;

export function copyToText(c: ListingCopy) {
  return [c.headline, ...c.description, ...c.key_selling_points].join("\n");
}
