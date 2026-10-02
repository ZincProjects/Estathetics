import { ChevronLeft, MapPinned, Pencil, Sparkles, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { PhotoUploader } from "@/components/photo-uploader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { listingFacts, priceLabel, psfLabel } from "@/lib/listing-format";
import { listingPhotoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { deleteListing, registerListingPhoto } from "../../actions";
import { NeighbourhoodReport } from "@/components/neighbourhood/neighbourhood-report";
import { GenerateNeighbourhoodButton, ListingPhotoGrid, PublishControls } from "./studio-controls";

type Props = PageProps<"/agent/listings/[listingId]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", listingId).maybeSingle();
  return { title: data?.title ?? "Listing" };
}

function Section({ title, icon: Icon, children, action }: { title: string; icon?: typeof Sparkles; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl">
          {Icon && <Icon className="size-5 text-brand" />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function ListingStudioPage({ params }: Props) {
  const profile = await requireProfile(["agent"]);
  const { listingId } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase
    .from("listings")
    .select("*, listing_photos(id, storage_path, room_label, sort), listing_amenities(category, name, lat, lng, distance_m, walk_minutes, source)")
    .eq("id", listingId)
    .order("sort", { referencedTable: "listing_photos" })
    .maybeSingle();
  if (!l) notFound();

  const photos = l.listing_photos.map((p) => ({ id: p.id, path: p.storage_path, url: listingPhotoUrl(p.storage_path), label: p.room_label }));
  const psf = psfLabel(l.asking_price, l.size_sqft);

  return (
    <>
      <Link href="/agent" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Listings
      </Link>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <Badge variant={l.status === "published" ? "default" : "secondary"}>{l.status === "published" ? "Live" : l.status === "draft" ? "Draft" : "Archived"}</Badge>
            {l.address}
          </span>
        }
        title={l.title}
        actions={<PublishControls listingId={l.id} status={l.status} publicPath={`/l/${l.slug}`} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Section
            title="Details"
            action={
              <Link href={`/agent/listings/${l.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Pencil /> Edit
              </Link>
            }
          >
            <p className="text-2xl font-medium">
              {priceLabel(l.asking_price)} {psf && <span className="text-base font-normal text-muted-foreground">· {psf}</span>}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {listingFacts(l).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {l.facilities.length > 0 && <p className="text-sm text-muted-foreground">Facilities: {l.facilities.join(" · ")}</p>}
            {l.highlights && <p className="whitespace-pre-line rounded-xl bg-secondary/60 p-3 text-sm">{l.highlights}</p>}
          </Section>

          <Section title="Photos">
            <ListingPhotoGrid listingId={l.id} photos={photos} coverPath={l.cover_photo_path} />
          </Section>

          <Section
            title="Neighbourhood"
            icon={MapPinned}
            action={
              l.listing_amenities.length > 0 && (
                <GenerateNeighbourhoodButton listingId={l.id} hasReport hasLocation={l.lat != null} />
              )
            }
          >
            {l.listing_amenities.length > 0 && l.lat != null && l.lng != null ? (
              <NeighbourhoodReport home={{ lat: l.lat, lng: l.lng, label: l.address }} amenities={l.listing_amenities} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {l.lat == null
                    ? "Pin the location first: edit the listing and pick the address from the search."
                    : "Find MRT stations, schools, hawker centres, malls and more within walking distance."}
                </p>
                <GenerateNeighbourhoodButton listingId={l.id} hasReport={false} hasLocation={l.lat != null} />
              </div>
            )}
          </Section>

          <Section title="Listing copy" icon={Sparkles}>
            <p className="text-sm text-muted-foreground">AI listing copy arrives in step 11.</p>
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-xl">Add photos</h2>
            <PhotoUploader userId={profile.id} folderId={l.id} bucket="listings" register={registerListingPhoto} />
            <p className="text-xs text-muted-foreground">Listing photos are public once you publish. Location data is removed on upload.</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="text-muted-foreground">Shown on every listing</p>
            <p className="font-medium">{profile.full_name}</p>
            <p>{profile.agency_name}</p>
            <p>CEA Reg. No. {profile.cea_number}</p>
          </div>
          <ConfirmAction
            action={deleteListing.bind(null, l.id)}
            confirm={`Delete “${l.title}”? This removes its photos, report and copy.`}
            variant="ghost"
            className="text-destructive"
          >
            <Trash2 /> Delete listing
          </ConfirmAction>
        </aside>
      </div>
    </>
  );
}
