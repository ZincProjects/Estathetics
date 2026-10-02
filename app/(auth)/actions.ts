"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { signInSchema, signUpSchema } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/server";

async function origin() {
  const h = await headers();
  return h.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: { ...raw, password: "" } };

  const { email, password, fullName, role } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { message: error.message, values: { ...raw, password: "" } };
  if (!data.session) {
    return { ok: true, message: "Check your inbox to confirm your email, then come back to sign in." };
  }
  redirect("/onboarding");
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: { email: raw.email } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { message: "Incorrect email or password.", values: { email: raw.email } };
  redirect(safeNext(formData.get("next") as string | null));
}

export async function signInWithGoogle(formData: FormData) {
  const role = formData.get("role");
  const next = safeNext(formData.get("next") as string | null);
  const params = new URLSearchParams({ next });
  if (role === "interior_designer" || role === "agent") params.set("role", role);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?${params}` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent("Google sign-in is not available yet.")}`);
  redirect(data.url);
}
