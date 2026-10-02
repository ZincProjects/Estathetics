"use server";

import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { onboardingSchema, slugify } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const raw = {
    ...Object.fromEntries(formData),
    specialties: formData.getAll("specialties"),
  };
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const input = parsed.data;
  const supabase = await createClient();
  const common = {
    role: input.role,
    full_name: input.fullName,
    phone: input.phone,
    bio: input.bio,
    slug: slugify(input.fullName),
    onboarded_at: new Date().toISOString(),
  };
  const update =
    input.role === "interior_designer"
      ? { ...common, firm_name: input.firmName, specialties: input.specialties, portfolio_urls: input.portfolioUrls }
      : { ...common, agency_name: input.agencyName, cea_number: input.ceaNumber };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) {
    console.error("onboarding failed", error);
    return { message: "We couldn't save your profile. Please try again.", values: raw };
  }
  redirect(homeFor(input.role));
}
