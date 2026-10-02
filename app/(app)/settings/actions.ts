"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { onboardingSchema } from "@/lib/schemas/profile";
import { BUCKETS } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const raw = { ...Object.fromEntries(formData), role: profile.role, specialties: formData.getAll("specialties") };
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const input = parsed.data;
  const common = { full_name: input.fullName, phone: input.phone, bio: input.bio };
  const update =
    input.role === "interior_designer"
      ? { ...common, firm_name: input.firmName, specialties: input.specialties, portfolio_urls: input.portfolioUrls }
      : { ...common, agency_name: input.agencyName, cea_number: input.ceaNumber };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
  if (error) return { message: "Couldn't save your profile.", values: raw };
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved" };
}

/** Removes every file under the user's folder in a bucket (storage RLS limits this to their own). */
async function emptyFolder(supabase: Awaited<ReturnType<typeof createClient>>, bucket: string, prefix: string) {
  const { data: entries } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries?.length) return;
  const files = entries.filter((e) => e.id).map((e) => `${prefix}/${e.name}`);
  const folders = entries.filter((e) => !e.id).map((e) => `${prefix}/${e.name}`);
  if (files.length) await supabase.storage.from(bucket).remove(files);
  for (const f of folders) await emptyFolder(supabase, bucket, f);
}

/** PDPA: delete the account, all rows (via cascade) and all uploaded files. */
export async function deleteMyAccount(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    return { message: "Type DELETE to confirm." };
  }
  const supabase = await createClient();
  for (const bucket of Object.values(BUCKETS)) await emptyFolder(supabase, bucket, profile.id);
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("delete_my_account failed", error);
    return { message: "We couldn't delete your account. Please contact privacy@estathetics.sg." };
  }
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
