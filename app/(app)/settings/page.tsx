import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";
import { requireProfile } from "@/lib/auth";
import { updateProfile } from "./actions";
import { DeleteAccountForm } from "./delete-account";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  const role = profile.role === "agent" || profile.role === "interior_designer" ? profile.role : null;

  return (
    <div className="max-w-2xl space-y-12">
      <section>
        <PageHeader title="Settings" description={`Signed in as ${profile.email ?? "you"}`} />
        <h2 className="mb-4 text-2xl">Profile</h2>
        <OnboardingForm
          action={updateProfile}
          submitLabel="Save profile"
          defaults={{
            role,
            fullName: profile.full_name ?? "",
            phone: profile.phone ?? "",
            firmName: profile.firm_name ?? "",
            agencyName: profile.agency_name ?? "",
            ceaNumber: profile.cea_number ?? "",
            bio: profile.bio ?? "",
            specialties: profile.specialties,
            portfolioUrls: profile.portfolio_urls,
          }}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-destructive/30 p-5">
        <h2 className="text-2xl">Delete your data</h2>
        <p className="text-sm text-muted-foreground">
          Under Singapore&apos;s PDPA you can ask us to delete your personal data. This permanently removes your account,
          projects, photos, designs, listings and leads. It can&apos;t be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
