"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Swatches } from "@/components/theme-card";
import { cn } from "@/lib/utils";

export type PickerTheme = { id: string; name: string; palette: string[]; preview: string; custom: boolean };

type Job = { id: string; status: "queued" | "running" | "succeeded" | "failed"; progress: number; message: string | null; error: string | null };

export function RedesignStudio({
  roomId,
  themes,
  hasPhoto,
  activeJobId,
}: {
  roomId: string;
  themes: PickerTheme[];
  hasPhoto: boolean;
  activeJobId?: string | null;
}) {
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [variations, setVariations] = useState(3);
  const [notes, setNotes] = useState("");
  const [jobId, setJobId] = useState<string | null>(activeJobId ?? null);
  const [starting, setStarting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const { data: job } = useQuery<Job>({
    queryKey: ["job", jobId],
    enabled: Boolean(jobId),
    queryFn: async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load progress");
      return res.json();
    },
    refetchInterval: (q) => (q.state.data && ["succeeded", "failed"].includes(q.state.data.status) ? false : 1500),
  });

  const finished = Boolean(job && job.id === jobId && (job.status === "succeeded" || job.status === "failed"));
  const active = Boolean(jobId) && !finished;

  // Announce each finished job once, then refresh the server-rendered gallery.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!finished || !job || announced.current === job.id) return;
    announced.current = job.id;
    if (job.status === "succeeded") toast.success(job.message ?? "Designs ready");
    else toast.error(job.error ?? "Redesign failed");
    startTransition(() => router.refresh());
  }, [finished, job, router]);

  // Refresh periodically so variations appear as they finish.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => startTransition(() => router.refresh()), 6000);
    return () => clearInterval(t);
  }, [active, router]);

  async function start() {
    setStarting(true);
    try {
      const res = await fetch("/api/ai/redesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, themeId, variations, notes: notes || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Couldn't start the redesign");
        return;
      }
      if (body.mocked) toast.info("Demo mode: no image AI key set, so the designs are tinted previews.");
      setJobId(body.jobId);
      startTransition(() => router.refresh());
    } finally {
      setStarting(false);
    }
  }

  if (active) {
    return (
      <div className="space-y-3 rounded-2xl border border-brand/30 bg-accent/40 p-4" role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 animate-pulse text-brand" />
          {job?.message ?? "Starting…"}
        </div>
        <Progress value={job?.progress ?? 2} aria-label="Redesign progress" />
        <p className="text-xs text-muted-foreground">
          Each variation takes 10–40 seconds. They appear below as they finish. It&apos;s safe to leave this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Theme</legend>
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {themes.map((t) => (
            <label
              key={t.id}
              className={cn(
                "w-36 shrink-0 cursor-pointer snap-start overflow-hidden rounded-xl border transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 lg:w-auto",
                themeId === t.id ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-foreground/30",
              )}
            >
              <input type="radio" name="theme" value={t.id} checked={themeId === t.id} onChange={() => setThemeId(t.id)} className="sr-only" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.preview} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="space-y-1.5 p-2">
                <p className="truncate text-xs font-medium">
                  {t.name}
                  {t.custom && <span className="ml-1 text-brand">•</span>}
                </p>
                <Swatches palette={t.palette} className="[&>span]:h-2" />
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Variations</legend>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((n) => (
            <Button key={n} type="button" variant={variations === n ? "default" : "outline"} onClick={() => setVariations(n)} aria-pressed={variations === n}>
              {n}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes for the AI (optional)</Label>
        <Input id="notes" value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. olive green sofa, add a study corner" />
      </div>

      <Button size="xl" className="w-full" disabled={!hasPhoto || !themeId || starting} onClick={start}>
        <Sparkles /> {starting ? "Starting…" : `Generate ${variations} designs`}
      </Button>
      {!hasPhoto && <p className="text-xs text-muted-foreground">Add a photo first.</p>}
    </div>
  );
}
