import { ChevronLeft, DoorOpen, ImageIcon, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { propertyTypeLabel, roomTypeLabel } from "@/lib/constants";
import { signOriginals } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { deleteProject } from "../../actions";
import { EditProjectDialog, NewRoomDialog } from "../../project-forms";

export async function generateMetadata({ params }: PageProps<"/designer/projects/[projectId]">): Promise<Metadata> {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("title").eq("id", projectId).maybeSingle();
  return { title: data?.title ?? "Project" };
}

export default async function ProjectPage({ params }: PageProps<"/designer/projects/[projectId]">) {
  await requireProfile(["interior_designer"]);
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, rooms(id, name, room_type, sort, room_photos(storage_path, is_primary), room_scans(id), designs(id))")
    .eq("id", projectId)
    .order("sort", { referencedTable: "rooms" })
    .maybeSingle();
  if (!project) notFound();

  const rooms = project.rooms.map((r) => {
    const cover = r.room_photos.find((p) => p.is_primary) ?? r.room_photos[0];
    return {
      ...r,
      cover: cover?.storage_path,
      photoCount: r.room_photos.length,
      scanned: r.room_scans.length > 0,
      designCount: r.designs.length,
    };
  });
  const urls = await signOriginals(supabase, rooms.map((r) => r.cover));

  return (
    <>
      <Link href="/designer" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Projects
      </Link>
      <PageHeader
        eyebrow={[project.property_type && propertyTypeLabel(project.property_type), project.client_name].filter(Boolean).join(" · ")}
        title={project.title}
        description={project.address ?? undefined}
        actions={
          <>
            <EditProjectDialog
              projectId={project.id}
              defaults={{
                title: project.title,
                clientName: project.client_name,
                propertyType: project.property_type,
                address: project.address,
                notes: project.notes,
              }}
            />
            {rooms.length > 0 && <NewRoomDialog projectId={project.id} />}
          </>
        }
      />
      {project.notes && (
        <p className="mb-6 max-w-2xl whitespace-pre-line rounded-xl bg-secondary/60 p-4 text-sm">{project.notes}</p>
      )}

      {rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Add the first room"
          description="Living room, master bedroom, kitchen… each room gets its own photos, scan and designs."
          action={<NewRoomDialog projectId={project.id} />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => {
            const src = r.cover ? urls.get(r.cover) : undefined;
            return (
              <li key={r.id}>
                <Link
                  href={`/designer/projects/${project.id}/rooms/${r.id}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[4/3] bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="size-7" /> Add photos
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <h2 className="truncate text-xl">{r.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {roomTypeLabel(r.room_type)} · {r.photoCount} photo{r.photoCount === 1 ? "" : "s"}
                      {r.scanned && " · Scanned"}
                      {r.designCount > 0 && ` · ${r.designCount} design${r.designCount === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-12 border-t border-border pt-6">
        <ConfirmAction
          action={deleteProject.bind(null, project.id)}
          confirm={`Delete “${project.title}” and all its rooms, photos and designs? This can't be undone.`}
          variant="ghost"
          className="text-destructive"
        >
          <Trash2 /> Delete project
        </ConfirmAction>
      </div>
    </>
  );
}
