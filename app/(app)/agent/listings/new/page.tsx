import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { createListing } from "../../actions";
import { ListingForm } from "../../listing-form";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  await requireProfile(["agent"]);
  return (
    <div className="max-w-2xl">
      <Link href="/agent" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Listings
      </Link>
      <PageHeader title="New listing" description="Start with the facts. Photos, neighbourhood and copy come next." />
      <ListingForm action={createListing} submitLabel="Create listing" />
    </div>
  );
}
