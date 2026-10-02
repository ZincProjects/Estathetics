"use client";

import { Check, ExternalLink, Globe, ImageIcon, Link2, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteListingPhoto, setCoverPhoto, setListingStatus, updatePhotoLabel } from "../../actions";

export function PublishControls({ listingId, status, publicPath }: { listingId: string; status: "draft" | "published" | "archived"; publicPath: string }) {
  const [pending, start] = useTransition();
  const run = (next: "draft" | "published") =>
    start(async () => {
      const res = await setListingStatus(listingId, next);
      if (!res.ok) toast.error(res.error);
      else toast.success(next === "published" ? "Listing is live" : "Listing unpublished");
    });

  if (status === "published") {
    return (
      <div className="flex flex-wrap gap-2">
        <a href={publicPath} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
          <ExternalLink /> View public page
        </a>
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(new URL(publicPath, window.location.origin).toString());
            toast.success("Link copied");
          }}
        >
          <Link2 /> Copy link
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => run("draft")}>
          Unpublish
        </Button>
      </div>
    );
  }
  return (
    <Button size="xl" disabled={pending} onClick={() => run("published")}>
      <Globe /> {pending ? "Publishing…" : "Publish listing"}
    </Button>
  );
}

type Photo = { id: string; url: string; path: string; label: string | null };

function LabelEditor({ listingId, photo }: { listingId: string; photo: Photo }) {
  const [value, setValue] = useState(photo.label ?? "");
  const [saved, setSaved] = useState(true);
  const [, start] = useTransition();
  return (
    <form
      className="flex gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await updatePhotoLabel(listingId, photo.id, value);
          setSaved(true);
        });
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="Label, e.g. Living room"
        aria-label="Photo label"
        className="h-8 text-xs"
      />
      {!saved && (
        <Button type="submit" size="icon-sm" aria-label="Save label">
          <Check />
        </Button>
      )}
    </form>
  );
}

export function ListingPhotoGrid({ listingId, photos, coverPath }: { listingId: string; photos: Photo[]; coverPath: string | null }) {
  if (!photos.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
        <ImageIcon className="size-6" /> No photos yet
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <li key={p.id} className="space-y-1.5">
          <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.label ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            {coverPath === p.path && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">Cover</span>}
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              {coverPath !== p.path && (
                <ConfirmAction action={setCoverPhoto.bind(null, listingId, p.path)} confirm="Use this as the cover photo?" variant="secondary" size="icon-xs" aria-label="Set as cover">
                  <Star />
                </ConfirmAction>
              )}
              <ConfirmAction action={deleteListingPhoto.bind(null, listingId, p.id)} confirm="Delete this photo?" variant="secondary" size="icon-xs" aria-label="Delete photo">
                <Trash2 />
              </ConfirmAction>
            </div>
          </div>
          <LabelEditor listingId={listingId} photo={p} />
        </li>
      ))}
    </ul>
  );
}
