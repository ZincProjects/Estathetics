import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site-header";
import { getProfile, homeFor } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/onboarding");
  if (profile.onboarded_at && profile.role) redirect(homeFor(profile.role));

  const role = profile.role === "interior_designer" || profile.role === "agent" ? profile.role : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-14 items-center">
        <Logo />
      </header>
      <main className="container-page max-w-lg flex-1 space-y-6 pb-16 pt-4">
        <div className="space-y-2">
          <p className="text-sm text-brand">Step 1 of 1</p>
          <h1 className="text-3xl">Tell us about your practice</h1>
          <p className="text-muted-foreground">This appears on your shared pages and listings. You can edit it later.</p>
        </div>
        <OnboardingForm
          defaults={{
            role,
            fullName: profile.full_name ?? "",
            phone: profile.phone ?? "",
            firmName: profile.firm_name ?? "",
            agencyName: profile.agency_name ?? "",
            ceaNumber: profile.cea_number ?? "",
          }}
        />
      </main>
    </div>
  );
}
