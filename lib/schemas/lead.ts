import { z } from "zod";

export const PDPA_CONSENT_TEXT =
  "I consent to Estathetics sharing my details with this agent so they can contact me about this property, in line with the Privacy Policy. I can withdraw consent at any time.";

export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(120),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^\+?[\d\s-]{8,16}$/.test(v), "Enter a valid phone number"),
    message: z.string().trim().max(2000).optional().transform((v) => v || null),
    consent: z.literal("on", "Please tick the consent box so the agent can contact you"),
    // Honeypot: real users never see or fill this field.
    company: z.string().max(0).optional(),
  })
  .refine((v) => v.email || v.phone, { message: "Leave an email or phone number", path: ["email"] });
