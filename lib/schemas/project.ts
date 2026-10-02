import { z } from "zod";
import { ROOM_TYPES } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Give the project a name").max(160),
  clientName: optionalText(120),
  propertyType: z
    .enum(["hdb", "condo", "ec", "landed", ""])
    .optional()
    .transform((v) => (v ? v : null)),
  address: optionalText(240),
  notes: optionalText(2000),
});

export const roomSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(1, "Name the room").max(120),
  roomType: z.enum(ROOM_TYPES.map((r) => r.value) as [string, ...string[]]),
});

export const registerPhotoSchema = z.object({
  folderId: z.uuid(),
  path: z.string().min(1).max(300),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
});

/** Uploaded photos must live under {userId}/{folderId}/ and be a jpeg we produced. */
export function isOwnedPhotoPath(path: string, userId: string, folderId: string) {
  return new RegExp(`^${userId}/${folderId}/[0-9a-f-]{36}\\.jpg$`).test(path);
}
