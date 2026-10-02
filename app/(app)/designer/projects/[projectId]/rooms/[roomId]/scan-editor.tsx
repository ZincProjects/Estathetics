"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CONSTRAINT_LABELS, CONSTRAINT_TYPES, type RoomScan } from "@/lib/schemas/room-scan";
import { updateScan } from "../../../../actions";

type FieldDef<T> = { key: keyof T & string; label: string; kind?: "text" | "number" | "select"; options?: readonly { value: string; label: string }[] };

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function TextIn({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function NumIn({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" inputMode="decimal" step="0.1" value={value ?? ""} onChange={(e) => onChange(num(e.target.value))} />
    </div>
  );
}

/** Editable list of objects: one card per row, add/remove. */
function RowsEditor<T extends Record<string, unknown>>({
  title,
  rows,
  fields,
  blank,
  onChange,
}: {
  title: string;
  rows: T[];
  fields: FieldDef<T>[];
  blank: T;
  onChange: (rows: T[]) => void;
}) {
  const set = (i: number, key: string, value: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-semibold">{title}</legend>
      {rows.map((row, i) => (
        <div key={i} className="relative grid gap-2 rounded-xl border border-border p-3 pr-10 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {f.kind === "select" ? (
                <select className={selectClass} value={String(row[f.key] ?? "")} onChange={(e) => set(i, f.key, e.target.value)}>
                  {f.options!.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.kind === "number" ? (
                <Input type="number" step="0.1" value={(row[f.key] as number | null) ?? ""} onChange={(e) => set(i, f.key, num(e.target.value))} />
              ) : (
                <Input value={String(row[f.key] ?? "")} onChange={(e) => set(i, f.key, e.target.value)} />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-1.5 top-1.5"
            aria-label={`Remove ${title} row`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus /> Add
      </Button>
    </fieldset>
  );
}

function LinesEditor({ title, items, onChange }: { title: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-semibold">{title}</Label>
      <Textarea
        rows={Math.max(3, items.length + 1)}
        value={items.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        placeholder="One per line"
      />
    </div>
  );
}

export function ScanEditor({ scanId, scan }: { scanId: string; scan: RoomScan }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RoomScan>(scan);
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  const patch = <K extends keyof RoomScan>(k: K, v: RoomScan[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const patchIn = <K extends keyof RoomScan>(k: K, v: Partial<RoomScan[K]>) =>
    setDraft((d) => ({ ...d, [k]: { ...(d[k] as object), ...v } }));

  function save() {
    const clean: RoomScan = {
      ...draft,
      fixtures: draft.fixtures.map((s) => s.trim()).filter(Boolean),
      opportunities: draft.opportunities.map((s) => s.trim()).filter(Boolean),
      photo_quality: { ...draft.photo_quality, issues: draft.photo_quality.issues.map((s) => s.trim()).filter(Boolean) },
    };
    startSaving(async () => {
      const res = await updateScan(scanId, clean);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Scan updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(scan);
      }}
    >
      <SheetTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil /> Edit
          </Button>
        }
      />
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">Edit scan</SheetTitle>
          <SheetDescription>Correct anything the AI got wrong. Your edits feed into the redesigns.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-28">
          <TextIn label="Room type" value={draft.room_type} onChange={(v) => patch("room_type", v)} />
          <TextIn label="Summary" value={draft.summary} onChange={(v) => patch("summary", v)} multiline />

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Dimensions (estimated, verify on site)</legend>
            <div className="grid grid-cols-2 gap-2">
              <NumIn label="Length (m)" value={draft.dimensions.length_m} onChange={(v) => patchIn("dimensions", { length_m: v })} />
              <NumIn label="Width (m)" value={draft.dimensions.width_m} onChange={(v) => patchIn("dimensions", { width_m: v })} />
              <NumIn label="Area (sqm)" value={draft.dimensions.area_sqm} onChange={(v) => patchIn("dimensions", { area_sqm: v })} />
              <NumIn label="Ceiling (m)" value={draft.dimensions.ceiling_height_m} onChange={(v) => patchIn("dimensions", { ceiling_height_m: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Confidence</Label>
                <select
                  className={selectClass}
                  value={draft.dimensions.confidence}
                  onChange={(e) => patchIn("dimensions", { confidence: e.target.value as RoomScan["dimensions"]["confidence"] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (measured)</option>
                </select>
              </div>
              <TextIn label="Basis" value={draft.dimensions.basis} onChange={(v) => patchIn("dimensions", { basis: v })} />
            </div>
          </fieldset>

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold">Light</legend>
            <TextIn label="Direction" value={draft.natural_light.direction} onChange={(v) => patchIn("natural_light", { direction: v })} />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Level</Label>
              <select
                className={selectClass}
                value={draft.natural_light.level}
                onChange={(e) => patchIn("natural_light", { level: e.target.value as RoomScan["natural_light"]["level"] })}
              >
                <option value="dim">Dim</option>
                <option value="moderate">Moderate</option>
                <option value="bright">Bright</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <TextIn label="Notes" value={draft.natural_light.notes} onChange={(v) => patchIn("natural_light", { notes: v })} />
            </div>
          </fieldset>

          <RowsEditor
            title="Windows"
            rows={draft.windows}
            blank={{ location: "", type: "", approx_width_m: null, notes: "" }}
            fields={[
              { key: "location", label: "Location" },
              { key: "type", label: "Type" },
              { key: "approx_width_m", label: "Width (m, est.)", kind: "number" },
              { key: "notes", label: "Notes" },
            ]}
            onChange={(v) => patch("windows", v)}
          />
          <RowsEditor
            title="Doors"
            rows={draft.doors}
            blank={{ location: "", type: "", notes: "" }}
            fields={[
              { key: "location", label: "Location" },
              { key: "type", label: "Type" },
              { key: "notes", label: "Notes" },
            ]}
            onChange={(v) => patch("doors", v)}
          />

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-semibold">Finishes</legend>
            <TextIn label="Flooring" value={draft.flooring.material} onChange={(v) => patchIn("flooring", { material: v })} />
            <TextIn label="Flooring condition" value={draft.flooring.condition} onChange={(v) => patchIn("flooring", { condition: v })} />
            <TextIn label="Wall material" value={draft.walls.material} onChange={(v) => patchIn("walls", { material: v })} />
            <TextIn label="Wall colour" value={draft.walls.colour} onChange={(v) => patchIn("walls", { colour: v })} />
            <TextIn label="Wall condition" value={draft.walls.condition} onChange={(v) => patchIn("walls", { condition: v })} />
            <TextIn label="Ceiling" value={draft.ceiling.type} onChange={(v) => patchIn("ceiling", { type: v })} />
          </fieldset>

          <RowsEditor
            title="Constraints"
            rows={draft.constraints}
            blank={{ type: "other", description: "", location: "", design_impact: "" } as RoomScan["constraints"][number]}
            fields={[
              { key: "type", label: "Type", kind: "select", options: CONSTRAINT_TYPES.map((t) => ({ value: t, label: CONSTRAINT_LABELS[t] })) },
              { key: "location", label: "Location" },
              { key: "description", label: "Description" },
              { key: "design_impact", label: "Design impact" },
            ]}
            onChange={(v) => patch("constraints", v)}
          />
          <RowsEditor
            title="Existing furniture"
            rows={draft.existing_furniture}
            blank={{ item: "", recommendation: "unsure", notes: "" } as RoomScan["existing_furniture"][number]}
            fields={[
              { key: "item", label: "Item" },
              {
                key: "recommendation",
                label: "Recommendation",
                kind: "select",
                options: ["keep", "replace", "rework", "unsure"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
              },
              { key: "notes", label: "Notes" },
            ]}
            onChange={(v) => patch("existing_furniture", v)}
          />
          <LinesEditor title="Fixtures" items={draft.fixtures} onChange={(v) => patch("fixtures", v)} />
          <LinesEditor title="Opportunities" items={draft.opportunities} onChange={(v) => patch("opportunities", v)} />
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-4">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
