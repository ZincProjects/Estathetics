import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";

export const BUCKETS = {
  originals: "originals",
  designs: "designs",
  listings: "listings",
  avatars: "avatars",
} as const;

const SIGNED_TTL_SECONDS = 60 * 60;

/** Batch-sign private `originals` paths. Returns a path → url map (missing paths are omitted). */
export async function signOriginals(supabase: ServerSupabase, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const out = new Map<string, string>();
  if (!unique.length) return out;
  const { data, error } = await supabase.storage.from(BUCKETS.originals).createSignedUrls(unique, SIGNED_TTL_SECONDS);
  if (error) {
    console.error("signOriginals failed", error);
    return out;
  }
  for (const row of data) if (row.signedUrl && row.path) out.set(row.path, row.signedUrl);
  return out;
}

export function publicUrl(supabase: ServerSupabase, bucket: "designs" | "listings" | "avatars", path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
