"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { slugify } from "@/lib/schemas/profile";
import { themeSchema } from "@/lib/schemas/theme";
import { createClient } from "@/lib/supabase/server";

function parse(formData: FormData) {
  const raw = { ...Object.fromEntries(formData), palette: formData.getAll("palette") };
  return { raw, parsed: themeSchema.safeParse(raw) };
}

export async function saveTheme(themeId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await requireProfile(["interior_designer"]);
  const { raw, parsed } = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const row = { ...parsed.data, palette: parsed.data.palette.map((c) => c.toLowerCase()) };
  const { error } = themeId
    ? await supabase.from("themes").update(row).eq("id", themeId)
    : await supabase.from("themes").insert({ ...row, slug: slugify(row.name), is_preset: false });
  if (error) return { message: "Couldn't save the theme.", values: raw };

  revalidatePath("/designer/themes");
  return { ok: true, message: themeId ? "Theme updated" : "Theme created" };
}

export async function deleteTheme(themeId: string) {
  await requireProfile(["interior_designer"]);
  const supabase = await createClient();
  await supabase.from("themes").delete().eq("id", themeId);
  revalidatePath("/designer/themes");
}
