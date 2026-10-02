import type { Enums } from "@/lib/supabase/database.types";

export const PROPERTY_TYPES: { value: Enums<"property_type">; label: string }[] = [
  { value: "hdb", label: "HDB" },
  { value: "condo", label: "Condo" },
  { value: "ec", label: "Executive Condo" },
  { value: "landed", label: "Landed" },
];

export const propertyTypeLabel = (v: string | null | undefined) =>
  PROPERTY_TYPES.find((p) => p.value === v)?.label ?? "Property";

export const ROOM_TYPES = [
  { value: "living", label: "Living room" },
  { value: "dining", label: "Dining" },
  { value: "kitchen", label: "Kitchen" },
  { value: "master_bedroom", label: "Master bedroom" },
  { value: "bedroom", label: "Bedroom" },
  { value: "study", label: "Study / WFH" },
  { value: "bathroom", label: "Bathroom" },
  { value: "balcony", label: "Balcony" },
  { value: "foyer", label: "Foyer" },
  { value: "other", label: "Other" },
] as const;

export type RoomType = (typeof ROOM_TYPES)[number]["value"];

export const roomTypeLabel = (v: string | null | undefined) =>
  ROOM_TYPES.find((r) => r.value === v)?.label ?? "Room";

/** Max long edge for uploaded photos. Keeps uploads fast on mobile data and AI inputs small. */
export const UPLOAD_MAX_EDGE = 2048;
export const UPLOAD_MAX_FILES = 12;
