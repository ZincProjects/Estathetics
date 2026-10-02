import { ChevronLeft, Star, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { PhotoUploader } from "@/components/photo-uploader";
import { ScanReport } from "@/components/scan-report";
import { themePreviewSrc } from "@/components/theme-card";
import { requireProfile } from "@/lib/auth";
import { roomTypeLabel } from "@/lib/constants";
import { roomScanSchema } from "@/lib/schemas/room-scan";
import { publicUrl, signOriginals } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { deletePhoto, deleteRoom, registerPhoto, setPrimaryPhoto } from "../../../../actions";
import { DesignGallery, type GalleryBatch } from "./design-gallery";
import { RedesignStudio } from "./redesign-studio";
import { ScanEditor } from "./scan-editor";
import { ScanButton } from "./scan-panel";

type Props = PageProps<"/designer/projects/[projectId]/rooms/[roomId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();
  return { title: data?.name ?? "Room" };
}

/** Jobs older than this are treated as abandoned (e.g. the function timed out). */
function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-xl">{title}</h2>
      {children}
    </div>
  );
}

export default async function RoomPage({ params }: Props) {
  const profile = await requireProfile(["interior_designer"]);
  const { projectId, roomId } = await params;
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("*, projects(id, title), room_photos(id, storage_path, is_primary, width, height, created_at)")
    .eq("id", roomId)
    .eq("project_id", projectId)
    .order("created_at", { referencedTable: "room_photos" })
    .maybeSingle();
  if (!room || !room.projects) notFound();

  const [{ data: scanRow }, { data: designRows }, { data: themeRows }, { data: activeJob }] = await Promise.all([
    supabase
      .from("room_scans")
      .select("id, data, model, created_at, edited_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("designs")
      .select("id, batch_id, variation, status, storage_path, chosen, theme_name, provider, source_photo_id, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .order("variation"),
    supabase.from("themes").select("id, slug, name, palette, is_preset, owner_id, created_at").order("is_preset").order("created_at"),
    supabase
      .from("generation_jobs")
      .select("id")
      .eq("kind", "redesign")
      .in("status", ["queued", "running"])
      .eq("input->>room_id", roomId)
      .gt("created_at", minutesAgo(10))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const photos = room.room_photos;
  const urls = await signOriginals(supabase, photos.map((p) => p.storage_path));
  const primary = photos.find((p) => p.is_primary) ?? photos[0];
  const scan = scanRow ? roomScanSchema.safeParse(scanRow.data) : null;

  // Group variations into batches; each batch compares against its own source photo.
  type PendingBatch = Omit<GalleryBatch, "originalUrl"> & { sourcePhotoId: string | null };
  const batches = new Map<string, PendingBatch>();
  for (const d of designRows ?? []) {
    const b =
      batches.get(d.batch_id) ??
      batches
        .set(d.batch_id, {
          batchId: d.batch_id,
          themeName: d.theme_name,
          createdAt: d.created_at,
          mocked: false,
          sourcePhotoId: d.source_photo_id,
          designs: [],
        } satisfies PendingBatch)
        .get(d.batch_id)!;
    if (d.provider === "mock") b.mocked = true;
    b.designs.push({
      id: d.id,
      variation: d.variation,
      status: d.status,
      chosen: d.chosen,
      url: d.storage_path ? publicUrl(supabase, "designs", d.storage_path) : null,
    });
  }
  const photoPathById = new Map(photos.map((p) => [p.id, p.storage_path]));
  const originalFor = (b: { sourcePhotoId: string | null }) =>
    urls.get(photoPathById.get(b.sourcePhotoId ?? "") ?? "") ?? (primary ? urls.get(primary.storage_path) : "") ?? "";

  const pickerThemes = (themeRows ?? [])
    .filter((t) => t.is_preset || t.owner_id === profile.id)
    .sort((a, b) => Number(a.is_preset) - Number(b.is_preset))
    .map((t) => ({ id: t.id, name: t.name, palette: t.palette, custom: !t.is_preset, preview: themePreviewSrc(t) }));

  return (
    <>
      <Link
        href={`/designer/projects/${projectId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {room.projects.title}
      </Link>
      <PageHeader eyebrow={roomTypeLabel(room.room_type)} title={room.name} />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section className="space-y-6">
          {primary ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls.get(primary.storage_path)} alt={`${room.name}, main photo`} className="max-h-[70vh] w-full object-contain" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 text-center text-muted-foreground">
              <p className="font-heading text-xl text-foreground">No photos yet</p>
              <p className="max-w-xs text-sm">
                Stand in a corner and capture the whole room at eye level. Include windows and doors for the best scan.
              </p>
            </div>
          )}

          {photos.length > 0 && (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Room photos">
              {photos.map((p) => (
                <li key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls.get(p.storage_path)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  {p.is_primary && (
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Main</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1">
                    {!p.is_primary && (
                      <ConfirmAction
                        action={setPrimaryPhoto.bind(null, roomId, p.id)}
                        confirm="Use this as the main photo for scanning and redesigns?"
                        variant="secondary"
                        size="icon-xs"
                        aria-label="Set as main photo"
                      >
                        <Star />
                      </ConfirmAction>
                    )}
                    <ConfirmAction
                      action={deletePhoto.bind(null, roomId, p.id)}
                      confirm="Delete this photo?"
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Delete photo"
                    >
                      <Trash2 />
                    </ConfirmAction>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <DesignGallery
            roomId={roomId}
            batches={[...batches.values()].map((b) => ({ ...b, originalUrl: originalFor(b) }))}
          />

          {scanRow && scan?.success && (
            <ScanReport
              scan={scan.data}
              meta={`${scanRow.model === "mock" ? "Demo scan" : "AI scan"} · ${new Date(scanRow.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}${scanRow.edited_at ? " · edited by you" : ""}`}
              actions={<ScanEditor scanId={scanRow.id} scan={scan.data} />}
            />
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card title="Photos">
            <PhotoUploader userId={profile.id} roomId={roomId} register={registerPhoto} />
            <p className="text-xs text-muted-foreground">
              Photos are private to you. They&apos;re resized on your device and location data is removed.
            </p>
          </Card>

          <Card title="1 · Scan">
            <p className="text-sm text-muted-foreground">
              {scanRow
                ? "Scan ready. Edit anything that looks off, because redesigns use it to keep windows, doors and beams in place."
                : "Get estimated dimensions, light, constraints and opportunities from the main photo."}
            </p>
            <ScanButton roomId={roomId} hasPhoto={photos.length > 0} hasScan={Boolean(scanRow)} />
          </Card>

          <Card title="2 · Redesign">
            <RedesignStudio roomId={roomId} themes={pickerThemes} hasPhoto={photos.length > 0} activeJobId={activeJob?.id} />
          </Card>

          <ConfirmAction
            action={deleteRoom.bind(null, projectId, roomId)}
            confirm={`Delete “${room.name}” with its photos and designs? This can't be undone.`}
            variant="ghost"
            className="text-destructive"
          >
            <Trash2 /> Delete room
          </ConfirmAction>
        </aside>
      </div>
    </>
  );
}
