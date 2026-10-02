import { after, NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorResponse } from "@/lib/ai/http";
import { runRedesignJob } from "@/lib/ai/redesign/run";
import { assertWithinRateLimit, RateLimitedError, recordUsage } from "@/lib/ai/usage";
import { getProfile } from "@/lib/auth";
import { mock } from "@/lib/env";
import { roomTypeLabel } from "@/lib/constants";
import { prompts } from "@/lib/prompts";
import { roomScanSchema } from "@/lib/schemas/room-scan";
import { createClient } from "@/lib/supabase/server";

// Generation continues in after() for up to this long.
export const maxDuration = 300;

const bodySchema = z.object({
  roomId: z.uuid(),
  themeId: z.uuid(),
  variations: z.number().int().min(2).max(4),
  notes: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "interior_designer") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { roomId, themeId, variations, notes } = parsed.data;

  const supabase = await createClient();
  const [{ data: room }, { data: theme }, { data: scanRow }] = await Promise.all([
    supabase.from("rooms").select("id, name, room_type, room_photos(id, storage_path, is_primary)").eq("id", roomId).maybeSingle(),
    supabase.from("themes").select("id, slug, name, description, palette, materials, mood").eq("id", themeId).maybeSingle(),
    supabase.from("room_scans").select("data").eq("room_id", roomId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (!theme) return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  const photo = room.room_photos.find((p) => p.is_primary) ?? room.room_photos[0];
  if (!photo) return NextResponse.json({ error: "Add a photo of the room first." }, { status: 400 });

  try {
    const remaining = await assertWithinRateLimit(supabase, "redesign");
    if (remaining < variations) throw new RateLimitedError("redesign");

    const scan = scanRow ? roomScanSchema.safeParse(scanRow.data) : null;
    const batchId = crypto.randomUUID();
    const p = prompts.redesign;
    const specs = Array.from({ length: variations }, (_, i) => ({
      designId: crypto.randomUUID(),
      variation: i + 1,
      seed: Math.floor(Math.random() * 2 ** 31),
      prompt: p.build({
        roomType: scan?.success ? scan.data.room_type : roomTypeLabel(room.room_type),
        themeName: theme.name,
        themeDescription: theme.description,
        materials: theme.materials,
        mood: theme.mood,
        palette: theme.palette,
        scan: scan?.success ? scan.data : null,
        notes,
        variation: i + 1,
      }),
    }));

    const { error: dErr } = await supabase.from("designs").insert(
      specs.map((s) => ({
        id: s.designId,
        room_id: room.id,
        source_photo_id: photo.id,
        theme_id: theme.id,
        theme_name: theme.name,
        batch_id: batchId,
        variation: s.variation,
        prompt: s.prompt,
        status: "pending" as const,
      })),
    );
    if (dErr) throw dErr;

    const { data: job, error: jErr } = await supabase
      .from("generation_jobs")
      .insert({
        kind: "redesign",
        status: "queued",
        message: "Queued",
        input: { room_id: room.id, batch_id: batchId, theme_id: theme.id, variations, prompt_version: p.version },
      })
      .select("id")
      .single();
    if (jErr) throw jErr;

    // Charge up front so parallel requests can't exceed the limit.
    await recordUsage(supabase, profile.id, "redesign", {
      mocked: mock.redesign,
      units: variations,
      meta: { room_id: room.id, batch_id: batchId, job_id: job.id },
    });

    after(() =>
      runRedesignJob(supabase, {
        jobId: job.id,
        userId: profile.id,
        photoPath: photo.storage_path,
        palette: theme.palette,
        themeSlug: theme.slug,
        variations: specs,
        negativePrompt: p.negative,
        strength: 0.8,
      }),
    );

    return NextResponse.json({ jobId: job.id, batchId, mocked: mock.redesign }, { status: 202 });
  } catch (e) {
    return aiErrorResponse(e, "starting the redesign");
  }
}
