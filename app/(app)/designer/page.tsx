import { FolderOpen } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";

export default async function DesignerHome() {
  const profile = await requireProfile(["interior_designer"]);
  return (
    <>
      <PageHeader eyebrow={profile.firm_name} title="Projects" description="Group rooms by client or property." />
      <EmptyState icon={FolderOpen} title="No projects yet" description="Projects arrive in the next step." />
    </>
  );
}
