import { BadgeCheck, Bath, BedDouble, Maximize2, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { NeighbourhoodReport } from "@/components/neighbourhood/neighbourhood-report";
import { propertyTypeLabel } from "@/lib/constants";
import { listingFacts, priceLabel, psfLabel } from "@/lib/listing-format";
import { listingCopySchema } from "@/lib/schemas/listing-copy";
import { listingPhotoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { formatArea, sqftToSqm } from "@/lib/units";
import { EnquiryForm } from "./enquiry-form";

type Props = PageProps<"/l/[slug]">;

/** Published listing with everything the public page needs. RLS hides drafts. */
const getListing = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, slug, agent_id, title, address, postal_code, property_type, size_sqft, bedrooms, bathrooms, floor_level, facing, tenure, lease_start_year, top_year, facilities, asking_price, highlights, lat, lng, cover_photo_path, published_at, updated_at, listing_photos(id, storage_path, room_label, sort, width, height), listing_amenities(category, name, lat, lng, distance_m, walk_minutes, source)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .order("sort", { referencedTable: "listing_photos" })
    .maybeSingle();
  if (!listing) return null;

  const [{ data: agent }, { data: copyRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, agency_name, cea_number, phone, avatar_path").eq("id", listing.agent_id).maybeSingle(),
    supabase.from("listing_content").select("data").eq("listing_id", listing.id).eq("kind", "listing_copy").eq("is_current", true).maybeSingle(),
  ]);
  const copy = copyRow ? listingCopySchema.safeParse(copyRow.data) : null;
  return { listing, agent, copy: copy?.success ? copy.data : null };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getListing(slug);
  if (!data) return { title: "Listing not found" };
  const { listing, copy } = data;
  const title = copy?.headline ?? listing.title;
  const description =
    copy?.description[0]?.slice(0, 160) ??
    `${propertyTypeLabel(listing.property_type)} at ${listing.address}. ${priceLabel(listing.asking_price)}.`;
  const image = listing.cover_photo_path ? listingPhotoUrl(listing.cover_photo_path) : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/l/${listing.slug}` },
    openGraph: { title, description, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function PublicListingPage({ params }: Props) {
  const { slug } = await params;
  const data = await getListing(slug);
  if (!data) notFound();
  const { listing: l, agent, copy } = data;

  after(async () => {
    const supabase = await createClient();
    await supabase.rpc("increment_listing_view", { p_slug: slug });
  });

  const photos = l.listing_photos.map((p) => ({ ...p, url: listingPhotoUrl(p.storage_path) }));
  const psf = psfLabel(l.asking_price, l.size_sqft);
  const headline = copy?.headline ?? l.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: headline,
    url: `/l/${l.slug}`,
    datePosted: l.published_at,
    image: photos.slice(0, 5).map((p) => p.url),
    offers: l.asking_price ? { "@type": "Offer", price: l.asking_price, priceCurrency: "SGD" } : undefined,
    about: {
      "@type": "Accommodation",
      address: { "@type": "PostalAddress", streetAddress: l.address, postalCode: l.postal_code, addressCountry: "SG" },
      numberOfBedrooms: l.bedrooms ?? undefined,
      numberOfBathroomsTotal: l.bathrooms ?? undefined,
      floorSize: l.size_sqft ? { "@type": "QuantitativeValue", value: l.size_sqft, unitCode: "FTK" } : undefined,
      geo: l.lat && l.lng ? { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng } : undefined,
    },
  };

  return (
    <article className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Gallery: swipe on phones, grid on larger screens */}
      {photos.length > 0 && (
        <section aria-label="Photos" className="container-page pt-4">
          <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:grid-rows-2 md:gap-2 md:overflow-visible md:px-0">
            {photos.slice(0, 5).map((p, i) => (
              <li
                key={p.id}
                className={
                  i === 0
                    ? "relative w-[88%] shrink-0 snap-center md:col-span-2 md:row-span-2 md:w-auto"
                    : "relative w-[88%] shrink-0 snap-center md:w-auto"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.room_label ?? `Photo ${i + 1}`}
                  className="aspect-[4/3] size-full rounded-2xl object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                />
                {p.room_label && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{p.room_label}</span>
                )}
              </li>
            ))}
          </ul>
          {photos.length > 5 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-muted-foreground">Show all {photos.length} photos</summary>
              <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {photos.slice(5).map((p) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.room_label ?? ""} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-10">
          <header className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {propertyTypeLabel(l.property_type)} · {l.address}
            </p>
            <h1 className="text-3xl leading-tight md:text-5xl">{headline}</h1>
            <p className="text-2xl font-medium">
              {priceLabel(l.asking_price)} {psf && <span className="text-base font-normal text-muted-foreground">· {psf}</span>}
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {l.bedrooms != null && (
                <li className="flex items-center gap-1.5">
                  <BedDouble className="size-4 text-brand" /> {l.bedrooms} bed
                </li>
              )}
              {l.bathrooms != null && (
                <li className="flex items-center gap-1.5">
                  <Bath className="size-4 text-brand" /> {l.bathrooms} bath
                </li>
              )}
              {l.size_sqft && (
                <li className="flex items-center gap-1.5">
                  <Maximize2 className="size-4 text-brand" /> {formatArea(sqftToSqm(Number(l.size_sqft)), "sqft")}
                </li>
              )}
            </ul>
          </header>

          {copy && (
            <section className="space-y-4 text-[1.05rem] leading-relaxed">
              {copy.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <ul className="grid gap-2 sm:grid-cols-2">
                {copy.key_selling_points.map((p, i) => (
                  <li key={i} className="flex gap-2 rounded-xl bg-secondary/60 p-3 text-sm">
                    <BadgeCheck className="size-4 shrink-0 text-brand" /> {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-2xl">Key facts</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {listingFacts(l).map(([k, v]) => (
                <div key={k} className="border-b border-border pb-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {l.facilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-sans text-sm font-semibold">Facilities</h3>
                <ul className="flex flex-wrap gap-2">
                  {l.facilities.map((f) => (
                    <li key={f} className="rounded-full border border-border px-3 py-1 text-sm">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {l.listing_amenities.length > 0 && l.lat != null && l.lng != null && (
            <section className="space-y-4">
              <h2 className="text-2xl">The neighbourhood</h2>
              <NeighbourhoodReport home={{ lat: l.lat, lng: l.lng, label: l.address }} amenities={l.listing_amenities} />
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" id="enquire">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-0.5">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Listed by</p>
              <p className="text-lg font-medium">{agent?.full_name ?? "Agent"}</p>
              {agent?.agency_name && <p className="text-sm">{agent.agency_name}</p>}
              {agent?.cea_number && <p className="text-sm text-muted-foreground">CEA Reg. No. {agent.cea_number}</p>}
              {agent?.phone && (
                <a href={`tel:${agent.phone.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand">
                  <Phone className="size-4" /> {agent.phone}
                </a>
              )}
            </div>
            <EnquiryForm listingId={l.id} agentId={l.agent_id} title={headline} />
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            Information is provided by the listing agent. Walking times and AI-assisted descriptions are estimates; please verify
            details with the agent.
          </p>
        </aside>
      </div>

      {/* Sticky enquiry bar for phones */}
      <a
        href="#enquire"
        className="fixed inset-x-4 bottom-4 z-30 flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-lg lg:hidden"
      >
        Enquire about this home
      </a>
    </article>
  );
}
