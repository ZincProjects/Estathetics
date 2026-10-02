import { z } from "zod";

/** CEA salesperson registration number, e.g. R123456A. Normalised to upper case without spaces. */
export const CEA_REGEX = /^[A-Z]\d{6}[A-Z]$/;
export const normaliseCea = (v: string) => v.replace(/\s+/g, "").toUpperCase();

export const DESIGN_SPECIALTIES = [
  "HDB renovation",
  "Condo",
  "Landed",
  "Small spaces",
  "Smart home",
  "Kitchen & bath",
  "Commercial",
  "Sustainable design",
  "Heritage / Peranakan",
  "Luxury",
] as const;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters").max(72),
  role: z.enum(["interior_designer", "agent"]),
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

const urlList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url("Portfolio links must be full URLs (https://…)")).max(10));

const base = {
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\+?[\d\s-]{8,16}$/.test(v), "Enter a valid phone number"),
  bio: z.string().trim().max(600).optional().transform((v) => v || null),
};

export const designerOnboardingSchema = z.object({
  role: z.literal("interior_designer"),
  ...base,
  firmName: z.string().trim().min(2, "Enter your firm or studio name").max(160),
  specialties: z.array(z.enum(DESIGN_SPECIALTIES)).min(1, "Pick at least one specialty"),
  portfolioUrls: urlList,
});

export const agentOnboardingSchema = z.object({
  role: z.literal("agent"),
  ...base,
  agencyName: z.string().trim().min(2, "Enter your agency").max(160),
  ceaNumber: z
    .string()
    .transform(normaliseCea)
    .refine((v) => CEA_REGEX.test(v), "CEA registration number looks like R123456A"),
});

export const onboardingSchema = z.discriminatedUnion("role", [designerOnboardingSchema, agentOnboardingSchema]);
export type OnboardingInput = z.input<typeof onboardingSchema>;

/** URL-safe slug with a short random suffix for uniqueness. */
export function slugify(input: string, suffix = true) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (!suffix) return base || "item";
  return `${base || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}
