import { FolderOpen, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import { propertyTypeLabel } from "@/lib/constants";
import { signOriginals } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { NewProjectDialog } from "./project-forms";

export const metadata: Metadata = { title: "Projects" };

export default async function DesignerHome() {
  const profile = await requireProfile(["interior_designer"]);
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, client_name, property_type, updated_at, rooms(id, room_photos(storage_path, is_primary))")
    .order("updated_at", { ascending: false });

  const rows = (projects ?? []).map((p) => {
    const photos = p.rooms.flatMap((r) => r.room_photos);
    const cover = photos.find((ph) => ph.is_primary) ?? photos[0];
    return { ...p, roomCount: p.rooms.length, photoCount: photos.length, cover: cover?.storage_path };
  });
  const urls = await signOriginals(supabase, rows.map((r) => r.cover));

  return (
    <>
      <PageHeader
        eyebrow={profile.firm_name}
        title="Projects"
        description="Group rooms by home or client, then scan and redesign each one."
        actions={rows.length > 0 && <NewProjectDialog />}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Start your first project"
          description="Create a project for a home, add its rooms, then snap photos to scan and redesign."
          action={<NewProjectDialog />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const src = p.cover ? urls.get(p.cover) : undefined;
            return (
              <li key={p.id}>
                <Link
                  href={`/designer/projects/${p.id}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="size-full object-cover transition-transform group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </div>
                    )}
                    {p.property_type && (
                      <Badge variant="secondary" className="absolute left-3 top-3">
                        {propertyTypeLabel(p.property_type)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 p-4">
                    <h2 className="truncate text-xl">{p.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {p.client_name ? `${p.client_name} · ` : ""}
                      {p.roomCount} room{p.roomCount === 1 ? "" : "s"} · {p.photoCount} photo{p.photoCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
