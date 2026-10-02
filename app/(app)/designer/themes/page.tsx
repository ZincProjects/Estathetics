import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { ThemeCard, type ThemeLike } from "@/components/theme-card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteTheme } from "./actions";
import { ThemeFormDialog } from "./theme-form";

export const metadata: Metadata = { title: "Theme Studio" };

export default async function ThemesPage() {
  const profile = await requireProfile(["interior_designer"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("themes")
    .select("id, slug, name, description, palette, materials, mood, is_preset, owner_id, created_at")
    .order("is_preset", { ascending: true })
    .order("created_at", { ascending: true });
  const themes = (data ?? []) as (ThemeLike & { owner_id: string | null })[];
  const mine = themes.filter((t) => t.owner_id === profile.id);
  const presets = themes.filter((t) => t.is_preset);

  return (
    <>
      <PageHeader
        title="Theme Studio"
        description="Ten curated looks tuned for Singapore homes, plus your own signature themes."
        actions={<ThemeFormDialog />}
      />

      {mine.length > 0 && (
        <section className="mb-10 space-y-4">
          <h2 className="text-2xl">Your themes</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {mine.map((t) => (
              <li key={t.id}>
                <ThemeCard
                  theme={t}
                  footer={
                    <div className="flex gap-2">
                      <ThemeFormDialog theme={t} />
                      <ConfirmAction
                        action={deleteTheme.bind(null, t.id)}
                        confirm={`Delete the theme “${t.name}”?`}
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${t.name}`}
                      >
                        <Trash2 />
                      </ConfirmAction>
                    </div>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl">Presets</h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {presets.map((t) => (
            <li key={t.id}>
              <ThemeCard theme={t} footer={<ThemeFormDialog startFrom={t} />} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
