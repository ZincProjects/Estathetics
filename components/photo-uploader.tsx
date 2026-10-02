"use client";

import { Camera, CheckCircle2, ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UPLOAD_MAX_EDGE, UPLOAD_MAX_FILES } from "@/lib/constants";
import { resizeToJpeg } from "@/lib/images/resize";
import { createClient } from "@/lib/supabase/client";

type Item = { key: string; name: string; status: "resizing" | "uploading" | "done" | "error"; error?: string };

export type RegisterPhoto = (input: {
  folderId: string;
  path: string;
  width: number;
  height: number;
}) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;

/**
 * Uploads photos straight from the browser to Storage (path {userId}/{folderId}/{uuid}.jpg,
 * enforced by storage RLS), then registers them via a server action.
 */
export function PhotoUploader({
  userId,
  folderId,
  register,
  bucket = "originals",
}: {
  userId: string;
  folderId: string;
  register: RegisterPhoto;
  bucket?: "originals" | "listings";
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const busy = items.some((i) => i.status === "resizing" || i.status === "uploading");

  const update = (key: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = [...list].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (files.length > UPLOAD_MAX_FILES) toast.info(`Uploading the first ${UPLOAD_MAX_FILES} photos.`);
    const batch = files.slice(0, UPLOAD_MAX_FILES).map((f) => ({ file: f, key: crypto.randomUUID() }));
    setItems(batch.map(({ file, key }) => ({ key, name: file.name || "photo.jpg", status: "resizing" })));

    const supabase = createClient();
    let ok = 0;
    // Sequential keeps memory low on phones (decoding several 12MP images at once can crash Safari).
    for (const { file, key } of batch) {
      try {
        const { blob, width, height } = await resizeToJpeg(file, UPLOAD_MAX_EDGE);
        update(key, { status: "uploading" });
        const path = `${userId}/${folderId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(bucket).upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw new Error(error.message);
        const res = await register({ folderId, path, width, height });
        if (!res.ok) {
          await supabase.storage.from(bucket).remove([path]);
          throw new Error(res.error);
        }
        update(key, { status: "done" });
        ok++;
      } catch (e) {
        const message =
          e instanceof Error && /decode|source image/i.test(e.message)
            ? "This format isn't supported by your browser. Try JPEG or PNG."
            : e instanceof Error
              ? e.message
              : "Upload failed";
        update(key, { status: "error", error: message });
      }
    }
    if (ok) {
      toast.success(`${ok} photo${ok > 1 ? "s" : ""} added`);
      startTransition(() => router.refresh());
    }
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" size="xl" disabled={busy} onClick={() => cameraRef.current?.click()}>
          <Camera /> Take photo
        </Button>
        <Button type="button" size="xl" variant="outline" disabled={busy} onClick={() => libraryRef.current?.click()}>
          <ImagePlus /> Upload
        </Button>
      </div>
      {/* capture= opens the rear camera directly on phones; desktop falls back to a file picker. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Take a photo"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        aria-label="Upload photos"
        data-testid="photo-input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {items.length > 0 && (
        <ul className="space-y-1.5 text-sm" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-2">
              {i.status === "done" ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : i.status === "error" ? (
                <TriangleAlert className="size-4 text-destructive" />
              ) : (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
              <span className="truncate">{i.name}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {i.status === "resizing" ? "Optimising…" : i.status === "uploading" ? "Uploading…" : i.status === "done" ? "Added" : i.error}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
