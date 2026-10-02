import { Inbox } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";

export default async function LeadsPage() {
  await requireProfile();
  return (
    <>
      <PageHeader title="Leads" description="Enquiries and quote requests sent to you." />
      <EmptyState icon={Inbox} title="No leads yet" description="When buyers enquire on your listings or request a look, they will appear here." />
    </>
  );
}
