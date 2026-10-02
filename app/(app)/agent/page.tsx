import { Building2, Eye, ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { propertyTypeLabel } from "@/lib/constants";
import { priceLabel } from "@/lib/listing-format";
import { listingPhotoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Listings" };

const STATUS = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Live", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
} as const;

export default async function AgentHome() {
  const profile = await requireProfile(["agent"]);
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, address, property_type, asking_price, status, cover_photo_path, view_count, updated_at")
    .order("updated_at", { ascending: false });

  const newButton = (
    <Link href="/agent/listings/new" className={buttonVariants({ size: "xl" })}>
      <Plus /> New listing
    </Link>
  );

  return (
    <>
      <PageHeader
        eyebrow={`${profile.agency_name ?? ""} · CEA ${profile.cea_number ?? "—"}`}
        title="Listings"
        description="Build listings that sell the lifestyle, not just the floor area."
        actions={listings?.length ? newButton : undefined}
      />
      {!listings?.length ? (
        <EmptyState
          icon={Building2}
          title="Create your first listing"
          description="Add the property details and photos. We'll build the neighbourhood report, AI copy and a shareable page."
          action={newButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <li key={l.id}>
              <Link href={`/agent/listings/${l.id}`} className="group block overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] bg-muted">
                  {l.cover_photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listingPhotoUrl(l.cover_photo_path)} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  <Badge variant={STATUS[l.status].variant} className="absolute left-3 top-3">
                    {STATUS[l.status].label}
                  </Badge>
                </div>
                <div className="space-y-1 p-4">
                  <p className="text-xs text-muted-foreground">{propertyTypeLabel(l.property_type)}</p>
                  <h2 className="truncate text-xl">{l.title}</h2>
                  <p className="truncate text-sm text-muted-foreground">{l.address}</p>
                  <div className="flex items-center justify-between pt-1 text-sm">
                    <span className="font-medium">{priceLabel(l.asking_price)}</span>
                    {l.status === "published" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="size-3.5" /> {l.view_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
