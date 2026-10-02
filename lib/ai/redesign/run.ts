import "server-only";
import { watermark } from "@/lib/images/watermark";
import { BUCKETS } from "@/lib/storage";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { ServerSupabase } from "@/lib/supabase/server";
import { getRedesignProvider } from "./index";

export type RedesignJobSpec = {
  jobId: string;
  userId: string;
  photoPath: string;
  palette: string[];
  themeSlug: string;
  variations: { designId: string; variation: number; prompt: string; seed: number }[];
  negativePrompt: string;
  strength: number;
};

/**
 * Renders each variation, watermarks it, uploads it to the public `designs` bucket and
 * marks the design ready. Runs after the HTTP response (via `after()`), reporting progress
 * on the generation_jobs row that the client polls.
 */
export async function runRedesignJob(supabase: ServerSupabase, spec: RedesignJobSpec) {
  const provider = getRedesignProvider();
  const total = spec.variations.length;
  const setJob = (patch: TablesUpdate<"generation_jobs">) =>
    supabase.from("generation_jobs").update(patch).eq("id", spec.jobId);

  await setJob({ status: "running", progress: 5, message: "Preparing your photo…" });

  try {
    const { data: file, error } = await supabase.storage.from(BUCKETS.originals).download(spec.photoPath);
    if (error || !file) throw new Error("Could not read the original photo");
    const image = Buffer.from(await file.arrayBuffer());
    const { data: signed } = await supabase.storage.from(BUCKETS.originals).createSignedUrl(spec.photoPath, 60 * 30);

    let done = 0;
    let ready = 0;
    // Two at a time: fast enough, and gentle on provider rate limits.
    const queue = [...spec.variations];
    const worker = async () => {
      for (let v = queue.shift(); v; v = queue.shift()) {
        try {
          const result = await provider.generate({
            image,
            imageUrl: signed?.signedUrl,
            prompt: v.prompt,
            negativePrompt: spec.negativePrompt,
            strength: spec.strength,
            seed: v.seed,
            palette: spec.palette,
            themeSlug: spec.themeSlug,
          });
          const marked = await watermark(result.image, { maxEdge: 2048 });
          const path = `${spec.userId}/${v.designId}.jpg`;
          const up = await supabase.storage.from(BUCKETS.designs).upload(path, marked, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
            upsert: true,
          });
          if (up.error) throw up.error;
          await supabase.from("designs").update({ status: "ready", storage_path: path, provider: provider.name }).eq("id", v.designId);
          ready++;
        } catch (e) {
          console.error("redesign variation failed", e);
          await supabase.from("designs").update({ status: "failed", provider: provider.name }).eq("id", v.designId);
        } finally {
          done++;
          await setJob({
            progress: Math.round(5 + (95 * done) / total),
            message: done < total ? `Rendered ${done} of ${total} variations…` : "Finishing up…",
          });
        }
      }
    };
    await Promise.all([worker(), worker()]);

    await setJob(
      ready > 0
        ? { status: "succeeded", progress: 100, message: `${ready} of ${total} variations ready`, output: { ready } }
        : { status: "failed", progress: 100, error: "All variations failed. Please try again." },
    );
  } catch (e) {
    console.error("redesign job failed", e);
    await supabase.from("designs").update({ status: "failed" }).in("id", spec.variations.map((v) => v.designId)).eq("status", "pending");
    await setJob({ status: "failed", progress: 100, error: e instanceof Error ? e.message : "Redesign failed" });
  }
}
