"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { Field, FieldMessage, FormMessage, TextareaField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Swatches, type ThemeLike } from "@/components/theme-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/forms";
import { saveTheme } from "./actions";

const STARTER = ["#efe6da", "#8b6f4e", "#2f3a35", "#c9a96e"];

export function ThemeFormDialog({ theme, startFrom }: { theme?: ThemeLike; startFrom?: ThemeLike }) {
  const [open, setOpen] = useState(false);
  const seed = theme ?? startFrom;
  const [palette, setPalette] = useState<string[]>(seed?.palette ?? STARTER);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveTheme(theme?.id ?? null, prev, fd);
    if (res.ok) setOpen(false);
    return res;
  }, {});
  const v = (k: string, fallback = "") => (state.values?.[k] as string | undefined) ?? fallback;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          theme ? (
            <Button variant="outline" size="sm">
              <Pencil /> Edit
            </Button>
          ) : startFrom ? (
            <Button variant="ghost" size="sm">
              <Plus /> Customise
            </Button>
          ) : (
            <Button size="xl">
              <Plus /> New theme
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{theme ? "Edit theme" : "Create a theme"}</DialogTitle>
          <DialogDescription>Your themes appear next to the presets when you redesign a room.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          <FormMessage message={state.ok ? undefined : state.message} />
          <Field
            label="Name"
            name="name"
            defaultValue={v("name", theme?.name ?? (startFrom ? `${startFrom.name} (my version)` : ""))}
            error={state.fieldErrors?.name}
          />
          <TextareaField
            label="Description"
            name="description"
            rows={2}
            defaultValue={v("description", seed?.description ?? "")}
            error={state.fieldErrors?.description}
          />

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Palette</legend>
            <Swatches palette={palette} />
            <ul className="grid grid-cols-2 gap-2">
              {palette.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`Colour ${i + 1}`}
                    value={c}
                    onChange={(e) => setPalette((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                    className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  />
                  <Input
                    name="palette"
                    value={c}
                    onChange={(e) => setPalette((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove colour"
                    disabled={palette.length <= 2}
                    onClick={() => setPalette((p) => p.filter((_, j) => j !== i))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            {palette.length < 8 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPalette((p) => [...p, "#cccccc"])}>
                <Plus /> Add colour
              </Button>
            )}
            <FieldMessage id="palette-error" error={state.fieldErrors?.palette} />
          </fieldset>

          <Field
            label="Materials"
            name="materials"
            placeholder="light oak, linen, travertine"
            hint="Comma-separated"
            defaultValue={v("materials", seed?.materials.join(", "))}
            error={state.fieldErrors?.materials}
          />
          <Field
            label="Mood keywords"
            name="mood"
            placeholder="serene, airy, grounded"
            hint="Comma-separated"
            defaultValue={v("mood", seed?.mood.join(", "))}
            error={state.fieldErrors?.mood}
          />
          <SubmitButton className="w-full" pendingLabel="Saving…">
            {theme ? "Save theme" : "Create theme"}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
