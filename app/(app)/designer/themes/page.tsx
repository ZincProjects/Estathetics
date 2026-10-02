import { Palette } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";

export default async function ThemesPage() {
  await requireProfile(["interior_designer"]);
  return (
    <>
      <PageHeader title="Theme Studio" />
      <EmptyState icon={Palette} title="Coming soon" description="Preset and custom themes arrive in step 6." />
    </>
  );
}
