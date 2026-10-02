import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;
export type Role = NonNullable<Profile["role"]>;

/** Verified user id + email for this request (JWT verified via getClaims). */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
});

export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ? { ...data, email: user.email } : null;
});

/** Requires a signed-in, onboarded user, optionally with one of the given roles. */
export async function requireProfile(roles?: Role[]) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded_at || !profile.role) redirect("/onboarding");
  if (roles && !roles.includes(profile.role) && profile.role !== "admin") redirect(homeFor(profile.role));
  return profile as typeof profile & { role: Role };
}

export function homeFor(role: Role | null | undefined) {
  switch (role) {
    case "interior_designer":
      return "/designer";
    case "agent":
      return "/agent";
    default:
      return "/dashboard";
  }
}

/** Only allow same-origin relative redirects. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
