"use client";

import { RotateCcw, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AiProgress } from "@/components/ai-progress";
import { Button } from "@/components/ui/button";

const STAGES = [
  "Reading the room…",
  "Finding doors, windows and light…",
  "Estimating dimensions from references…",
  "Spotting beams, trunking and the DB box…",
  "Writing the scan report…",
];

export function ScanButton({ roomId, hasPhoto, hasScan }: { roomId: string; hasPhoto: boolean; hasScan: boolean }) {
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/ai/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Scan failed");
        return;
      }
      toast.success(body.mocked ? "Scan ready (demo data: no AI key set)" : "Scan ready");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setRunning(false);
    }
  }

  if (running) return <AiProgress stages={STAGES} expectedSeconds={35} />;

  return (
    <Button
      size="xl"
      variant={hasScan ? "outline" : "default"}
      className="w-full"
      disabled={!hasPhoto}
      onClick={run}
      title={hasPhoto ? undefined : "Add a photo first"}
    >
      {hasScan ? <RotateCcw /> : <ScanLine />}
      {hasScan ? "Re-scan room" : "Scan room with AI"}
    </Button>
  );
}
