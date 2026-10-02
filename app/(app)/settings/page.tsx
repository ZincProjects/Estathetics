import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const profile = await requireProfile();
  return (
    <>
      <PageHeader title="Settings" description={profile.email ?? undefined} />
      <p className="text-muted-foreground">Profile editing and PDPA data deletion arrive later in Phase 1.</p>
    </>
  );
}
