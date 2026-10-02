import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateListing } from "../../../actions";
import { ListingForm } from "../../../listing-form";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: PageProps<"/agent/listings/[listingId]/edit">) {
  await requireProfile(["agent"]);
  const { listingId } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase.from("listings").select("*").eq("id", listingId).maybeSingle();
  if (!l) notFound();

  return (
    <div className="max-w-2xl">
      <Link href={`/agent/listings/${l.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> {l.title}
      </Link>
      <PageHeader title="Edit details" />
      <ListingForm
        action={updateListing.bind(null, l.id)}
        submitLabel="Save changes"
        defaults={{
          propertyType: l.property_type,
          title: l.title,
          address: l.address,
          postalCode: l.postal_code,
          block: l.block,
          unit: l.unit,
          lat: l.lat,
          lng: l.lng,
          sizeSqft: l.size_sqft,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          floorLevel: l.floor_level,
          facing: l.facing,
          tenure: l.tenure,
          leaseStartYear: l.lease_start_year,
          topYear: l.top_year,
          facilities: l.facilities,
          askingPrice: l.asking_price,
          highlights: l.highlights,
        }}
      />
    </div>
  );
}
