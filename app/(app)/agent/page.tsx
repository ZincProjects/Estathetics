import { Building2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";

export default async function AgentHome() {
  const profile = await requireProfile(["agent"]);
  return (
    <>
      <PageHeader eyebrow={`${profile.agency_name} · CEA ${profile.cea_number}`} title="Listings" />
      <EmptyState icon={Building2} title="No listings yet" description="Listing Studio arrives in step 9." />
    </>
  );
}
