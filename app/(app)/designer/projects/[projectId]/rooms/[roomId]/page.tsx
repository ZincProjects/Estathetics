import { ChevronLeft, ScanLine, Sparkles, Star, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { PhotoUploader } from "@/components/photo-uploader";
import { requireProfile } from "@/lib/auth";
import { roomTypeLabel } from "@/lib/constants";
import { signOriginals } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { deletePhoto, deleteRoom, registerPhoto, setPrimaryPhoto } from "../../../../actions";

type Props = PageProps<"/designer/projects/[projectId]/rooms/[roomId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();
  return { title: data?.name ?? "Room" };
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

  const photos = room.room_photos;
  const urls = await signOriginals(supabase, photos.map((p) => p.storage_path));
  const primary = photos.find((p) => p.is_primary) ?? photos[0];

  return (
    <>
      <Link
        href={`/designer/projects/${projectId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {room.projects.title}
      </Link>
      <PageHeader eyebrow={roomTypeLabel(room.room_type)} title={room.name} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-4">
          {primary ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls.get(primary.storage_path)} alt={`${room.name}, main photo`} className="max-h-[70vh] w-full object-contain" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
              <p className="font-heading text-xl text-foreground">No photos yet</p>
              <p className="max-w-xs text-sm">
                Stand in a corner and capture the whole room at eye level. Include windows and doors for the best scan.
              </p>
            </div>
          )}

          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Room photos">
              {photos.map((p) => (
                <li key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls.get(p.storage_path)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                  {p.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">Main</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    {!p.is_primary && (
                      <ConfirmAction
                        action={setPrimaryPhoto.bind(null, roomId, p.id)}
                        confirm="Use this as the main photo for scanning and redesigns?"
                        variant="secondary"
                        size="icon-sm"
                        aria-label="Set as main photo"
                      >
                        <Star />
                      </ConfirmAction>
                    )}
                    <ConfirmAction
                      action={deletePhoto.bind(null, roomId, p.id)}
                      confirm="Delete this photo?"
                      variant="secondary"
                      size="icon-sm"
                      aria-label="Delete photo"
                    >
                      <Trash2 />
                    </ConfirmAction>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-xl">Photos</h2>
            <PhotoUploader userId={profile.id} roomId={roomId} register={registerPhoto} />
            <p className="text-xs text-muted-foreground">
              Photos are private to you. They are resized on your device and location data is removed.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-xl">AI design</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ScanLine className="size-5 text-brand" /> Room scan arrives in step 5
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="size-5 text-brand" /> Redesign arrives in step 7
            </div>
          </div>

          <ConfirmAction
            action={deleteRoom.bind(null, projectId, roomId)}
            confirm={`Delete “${room.name}” and its photos? This can't be undone.`}
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
