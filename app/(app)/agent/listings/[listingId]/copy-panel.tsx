"use client";

import { Copy, Pencil, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AiProgress } from "@/components/ai-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TONES, type ListingCopy, type Tone } from "@/lib/schemas/listing-copy";
import { cn } from "@/lib/utils";
import { saveListingCopy } from "../../actions";

export type CurrentCopy = ListingCopy & { tone: Tone; warnings: string[]; edited?: boolean; mocked: boolean };

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
      }}
    >
      <Copy />
    </Button>
  );
}

function Editor({ listingId, copy, onDone }: { listingId: string; copy: CurrentCopy; onDone: () => void }) {
  const [headline, setHeadline] = useState(copy.headline);
  const [description, setDescription] = useState(copy.description.join("\n\n"));
  const [points, setPoints] = useState(copy.key_selling_points.join("\n"));
  const [saving, start] = useTransition();
  const router = useRouter();
  return (
    <div className="space-y-3">
      <Input value={headline} onChange={(e) => setHeadline(e.target.value)} aria-label="Headline" className="text-base font-medium" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} aria-label="Description (blank line between paragraphs)" />
      <Textarea value={points} onChange={(e) => setPoints(e.target.value)} rows={6} aria-label="Key selling points (one per line)" />
      <div className="flex gap-2">
        <Button
          disabled={saving}
          onClick={() =>
            start(async () => {
              const res = await saveListingCopy(listingId, {
                headline,
                description: description.split(/\n\s*\n/),
                key_selling_points: points.split("\n"),
              });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Copy saved");
              onDone();
              router.refresh();
            })
          }
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function CopyPanel({ listingId, current }: { listingId: string; current: CurrentCopy | null }) {
  const [tone, setTone] = useState<Tone>(current?.tone ?? "professional");
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function generate() {
    setRunning(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(body.error ?? "Couldn't write the copy");
      toast.success(body.mocked ? "Draft ready (demo mode: template copy)" : "Draft ready");
      startTransition(() => router.refresh());
    } finally {
      setRunning(false);
    }
  }

  const fullText = current ? [current.headline, "", ...current.description, "", ...current.key_selling_points.map((p) => `• ${p}`)].join("\n") : "";

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tone</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TONES.map((t) => (
            <label
              key={t.value}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                tone === t.value ? "border-brand bg-accent/60" : "border-border hover:bg-muted",
              )}
            >
              <input type="radio" name="tone" value={t.value} checked={tone === t.value} onChange={() => setTone(t.value)} className="sr-only" />
              <span className="block font-medium">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {running ? (
        <AiProgress stages={["Reading your listing facts…", "Writing the headline…", "Drafting the description…", "Checking every number against your facts…"]} expectedSeconds={25} />
      ) : (
        <Button size={current ? "default" : "xl"} variant={current ? "outline" : "default"} onClick={generate}>
          {current ? <RotateCcw /> : <Sparkles />} {current ? "Rewrite in this tone" : "Write listing copy"}
        </Button>
      )}

      {current && !running && (
        <article className="space-y-4 rounded-xl border border-border p-4">
          {current.warnings.length > 0 && (
            <div className="space-y-1 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              <p className="flex items-center gap-2 font-medium">
                <TriangleAlert className="size-4" /> Please check before publishing
              </p>
              <ul className="list-disc pl-5">
                {current.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {editing ? (
            <Editor listingId={listingId} copy={current} onDone={() => setEditing(false)} />
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl">{current.headline}</h3>
                <div className="flex shrink-0">
                  <CopyButton text={fullText} label="All copy" />
                  <Button variant="ghost" size="icon-sm" aria-label="Edit copy" onClick={() => setEditing(true)}>
                    <Pencil />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 text-[0.95rem] leading-relaxed">
                {current.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {current.key_selling_points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {TONES.find((t) => t.value === current.tone)?.label} tone
                {current.mocked ? " · demo template" : " · written by AI from your facts only"}
                {current.edited ? " · edited by you" : ""}
              </p>
            </>
          )}
        </article>
      )}
    </div>
  );
}
