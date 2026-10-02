"use client";

import { Check, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chooseDesign, deleteDesignBatch } from "../../../../actions";

export type GalleryDesign = {
  id: string;
  variation: number;
  status: "pending" | "ready" | "failed";
  url: string | null;
  chosen: boolean;
};

export type GalleryBatch = {
  batchId: string;
  themeName: string;
  createdAt: string;
  mocked: boolean;
  originalUrl: string;
  designs: GalleryDesign[];
};

function Batch({ roomId, batch }: { roomId: string; batch: GalleryBatch }) {
  const firstReady = batch.designs.find((d) => d.chosen) ?? batch.designs.find((d) => d.status === "ready");
  const [selectedId, setSelectedId] = useState(firstReady?.id);
  const [pending, start] = useTransition();
  const selected = batch.designs.find((d) => d.id === selectedId && d.status === "ready");

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">{batch.themeName}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(batch.createdAt).toLocaleString("en-SG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            {batch.mocked && " · Demo render"}
          </p>
        </div>
        <ConfirmAction
          action={deleteDesignBatch.bind(null, roomId, batch.batchId)}
          confirm={`Delete these ${batch.themeName} designs?`}
          variant="ghost"
          size="icon-sm"
          aria-label="Delete this set of designs"
        >
          <Trash2 />
        </ConfirmAction>
      </header>

      {selected?.url ? (
        <BeforeAfterSlider before={batch.originalUrl} after={selected.url} />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <ul className="flex flex-1 gap-2 overflow-x-auto" aria-label="Variations">
          {batch.designs.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                disabled={d.status !== "ready"}
                onClick={() => setSelectedId(d.id)}
                aria-label={`Variation ${d.variation}${d.chosen ? " (chosen)" : ""}`}
                aria-pressed={selectedId === d.id}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-lg border-2 bg-muted",
                  selectedId === d.id ? "border-brand" : "border-transparent",
                )}
              >
                {d.status === "ready" && d.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.url} alt="" className="size-full object-cover" />
                ) : d.status === "failed" ? (
                  <TriangleAlert className="m-auto size-5 text-destructive" />
                ) : (
                  <Loader2 className="m-auto size-5 animate-spin text-muted-foreground" />
                )}
                {d.chosen && (
                  <span className="absolute right-0.5 top-0.5 rounded-full bg-brand p-0.5 text-brand-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <Button
            variant={selected.chosen ? "secondary" : "default"}
            size="sm"
            disabled={pending}
            onClick={() => start(() => chooseDesign(roomId, selected.id, !selected.chosen))}
          >
            <Check /> {selected.chosen ? "Chosen" : "Choose"}
          </Button>
        )}
      </div>
    </article>
  );
}

export function DesignGallery({ roomId, batches }: { roomId: string; batches: GalleryBatch[] }) {
  if (!batches.length) return null;
  return (
    <section className="space-y-4" aria-label="Redesigns">
      <h2 className="text-2xl">Redesigns</h2>
      {batches.map((b) => (
        <Batch key={b.batchId} roomId={roomId} batch={b} />
      ))}
    </section>
  );
}
