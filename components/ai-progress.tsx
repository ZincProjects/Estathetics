"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

/**
 * Indeterminate-but-honest progress for AI work: cycles through stage messages and
 * eases a bar toward ~90% over the expected duration, never claiming completion early.
 */
export function AiProgress({ stages, expectedSeconds = 30 }: { stages: string[]; expectedSeconds?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 0.25), 250);
    return () => clearInterval(t);
  }, []);
  const pct = Math.min(92, 92 * (1 - Math.exp(-elapsed / (expectedSeconds / 2))));
  const stage = stages[Math.min(stages.length - 1, Math.floor((elapsed / expectedSeconds) * stages.length))];

  return (
    <div className="space-y-3 rounded-2xl border border-brand/30 bg-accent/40 p-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="size-4 animate-pulse text-brand" />
        {stage}
      </div>
      <Progress value={pct} aria-label="AI progress" />
      <p className="text-xs text-muted-foreground">This usually takes {expectedSeconds < 60 ? `under a minute` : `a minute or two`}. You can keep this page open.</p>
    </div>
  );
}
