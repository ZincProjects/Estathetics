import { z } from "zod";
import { sqmToSqft } from "@/lib/units";

export const CONDO_FACILITIES = [
  "Swimming pool",
  "Gym",
  "BBQ pits",
  "Function room",
  "Clubhouse",
  "Children's playground",
  "Tennis court",
  "Jogging track",
  "Sky garden",
  "Jacuzzi",
  "Steam room",
  "Multi-purpose court",
  "24-hour security",
  "Covered car park",
  "EV charging",
] as const;

export const FACINGS = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"] as const;

export const TENURES = [
  { value: "leasehold_99", label: "99-year leasehold" },
  { value: "leasehold_999", label: "999-year leasehold" },
  { value: "freehold", label: "Freehold" },
  { value: "leasehold_other", label: "Other leasehold" },
] as const;

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const optInt = (min: number, max: number, msg: string) =>
  z
    .union([z.literal(""), z.coerce.number().int(msg).min(min, msg).max(max, msg)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

export const listingSchema = z
  .object({
    propertyType: z.enum(["hdb", "condo", "ec", "landed"], "Choose a property type"),
    title: z.string().trim().min(4, "Add a short title").max(160),
    address: z.string().trim().min(4, "Enter the address").max(240),
    postalCode: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^\d{6}$/.test(v), "Singapore postal codes have 6 digits"),
    block: optText(20),
    unit: optText(20),
    lat: z.coerce.number().min(1.1).max(1.5).optional().or(z.literal("").transform(() => undefined)),
    lng: z.coerce.number().min(103.5).max(104.1).optional().or(z.literal("").transform(() => undefined)),
    sizeValue: z.coerce.number("Enter the floor area").positive("Enter the floor area").max(100000),
    sizeUnit: z.enum(["sqft", "sqm"]),
    bedrooms: optInt(0, 20, "0–20"),
    bathrooms: optInt(0, 20, "0–20"),
    floorLevel: optText(30),
    facing: optText(20),
    tenure: z
      .enum(["leasehold_99", "leasehold_999", "freehold", "leasehold_other", ""])
      .optional()
      .transform((v) => v || null),
    leaseStartYear: optInt(1960, 2100, "Enter a year like 1998"),
    topYear: optInt(1960, 2100, "Enter a year like 2015"),
    facilities: z.array(z.string().max(60)).max(40).default([]),
    askingPrice: z
      .union([z.literal(""), z.coerce.number().int("Whole dollars only").min(0).max(1_000_000_000)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    highlights: optText(2000),
  })
  .transform((v) => ({
    ...v,
    sizeSqft: v.sizeUnit === "sqft" ? v.sizeValue : Math.round(sqmToSqft(v.sizeValue)),
  }));

export type ListingInput = z.output<typeof listingSchema>;

/** HDB flats are 99-year leasehold; enforce sensible defaults. */
export function normaliseListing(input: ListingInput): ListingInput {
  if (input.propertyType === "hdb") return { ...input, tenure: "leasehold_99", facilities: [] };
  return input;
}
