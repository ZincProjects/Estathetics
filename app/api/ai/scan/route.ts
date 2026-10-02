import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorResponse } from "@/lib/ai/http";
import { scanRoomPhoto } from "@/lib/ai/room-scan";
import { assertWithinRateLimit, recordUsage } from "@/lib/ai/usage";
import { getProfile } from "@/lib/auth";
import { propertyTypeLabel, roomTypeLabel } from "@/lib/constants";
import { BUCKETS } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

const bodySchema = z.object({ roomId: z.uuid(), photoId: z.uuid().optional() });

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "interior_designer") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { roomId, photoId } = parsed.data;

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, room_type, projects(property_type), room_photos(id, storage_path, is_primary)")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const photo = photoId
    ? room.room_photos.find((p) => p.id === photoId)
    : (room.room_photos.find((p) => p.is_primary) ?? room.room_photos[0]);
  if (!photo) return NextResponse.json({ error: "Add a photo of the room first." }, { status: 400 });

  try {
    await assertWithinRateLimit(supabase, "room_scan");

    const { data: file, error: dlError } = await supabase.storage.from(BUCKETS.originals).download(photo.storage_path);
    if (dlError || !file) throw new Error("Could not read the photo");

    const result = await scanRoomPhoto({
      photo: await file.arrayBuffer(),
      roomName: room.name,
      roomType: roomTypeLabel(room.room_type),
      propertyType: room.projects?.property_type ? propertyTypeLabel(room.projects.property_type) : null,
    });

    const { data: saved, error } = await supabase
      .from("room_scans")
      .insert({
        room_id: room.id,
        photo_id: photo.id,
        data: result.scan,
        model: result.model,
        prompt_version: result.promptVersion,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;

    await recordUsage(supabase, profile.id, "room_scan", {
      usage: result.usage,
      mocked: result.mocked,
      meta: { room_id: room.id, scan_id: saved.id },
    });

    return NextResponse.json({ id: saved.id, scan: result.scan, mocked: result.mocked });
  } catch (e) {
    return aiErrorResponse(e, "scanning");
  }
}
