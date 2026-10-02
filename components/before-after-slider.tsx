"use client";

import { MoveHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Before/after comparison. The "after" image is clipped to the slider position; a native
 * range input drives it, so keyboard and screen readers work without extra code.
 */
export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Original",
  afterLabel = "Virtually staged (AI-generated)",
  className,
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const id = useId();
  return (
    <div className={cn("relative select-none overflow-hidden rounded-2xl border border-border bg-muted", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={before} alt={beforeLabel} className="block w-full object-contain" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={afterLabel}
        className="absolute inset-0 size-full object-contain"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }} aria-hidden>
        <div className="absolute inset-y-0 -left-px w-0.5 bg-white/90 shadow" />
        <div className="absolute top-1/2 -left-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md">
          <MoveHorizontal className="size-4" />
        </div>
      </div>
      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{beforeLabel}</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">AI design</span>
      <label htmlFor={id} className="sr-only">
        Compare original and redesign
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        aria-valuetext={`${Math.round(pos)}% original`}
      />
    </div>
  );
}
