"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { listingSchema, normaliseListing } from "@/lib/schemas/listing";
import { slugify } from "@/lib/schemas/profile";
import { isOwnedPhotoPath, registerPhotoSchema } from "@/lib/schemas/project";
import { BUCKETS } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

async function agent() {
  const profile = await requireProfile(["agent"]);
  return { profile, supabase: await createClient() };
}

function readListingForm(formData: FormData) {
  const raw = { ...Object.fromEntries(formData), facilities: formData.getAll("facilities") };
  return { raw, parsed: listingSchema.safeParse(raw) };
}

function toRow(input: ReturnType<typeof normaliseListing>) {
  return {
    property_type: input.propertyType,
    title: input.title,
    address: input.address,
    postal_code: input.postalCode,
    block: input.block,
    unit: input.unit,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    size_sqft: input.sizeSqft,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    floor_level: input.floorLevel,
    facing: input.facing,
    tenure: input.tenure,
    lease_start_year: input.leaseStartYear,
    top_year: input.topYear,
    facilities: input.facilities,
    asking_price: input.askingPrice,
    highlights: input.highlights,
  };
}

export async function createListing(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await agent();
  const { raw, parsed } = readListingForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const input = normaliseListing(parsed.data);
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...toRow(input), slug: slugify(input.title) })
    .select("id")
    .single();
  if (error) {
    console.error("createListing", error);
    return { message: "Couldn't create the listing. Please check the details.", values: raw };
  }
  revalidatePath("/agent");
  redirect(`/agent/listings/${data.id}`);
}

export async function updateListing(listingId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await agent();
  const { raw, parsed } = readListingForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const input = normaliseListing(parsed.data);
  const { data: before } = await supabase.from("listings").select("lat, lng").eq("id", listingId).single();
  const { error } = await supabase.from("listings").update(toRow(input)).eq("id", listingId);
  if (error) return { message: "Couldn't save changes.", values: raw };

  // A new location makes the cached neighbourhood report stale.
  if (before && (before.lat !== (input.lat ?? null) || before.lng !== (input.lng ?? null))) {
    await supabase.from("listing_amenities").delete().eq("listing_id", listingId);
  }
  revalidatePath(`/agent/listings/${listingId}`);
  redirect(`/agent/listings/${listingId}`);
}

export async function deleteListing(listingId: string) {
  const { supabase } = await agent();
  const { data: photos } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", listingId);
  await supabase.from("listings").delete().eq("id", listingId);
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length) await supabase.storage.from(BUCKETS.listings).remove(paths);
  revalidatePath("/agent");
  redirect("/agent");
}

export async function setListingStatus(listingId: string, status: "draft" | "published" | "archived") {
  const { profile, supabase } = await agent();
  if (status === "published") {
    // CEA requires the salesperson's registration number on every listing.
    if (!profile.cea_number) return { ok: false as const, error: "Add your CEA registration number in Settings first." };
    const { count } = await supabase.from("listing_photos").select("id", { count: "exact", head: true }).eq("listing_id", listingId);
    if (!count) return { ok: false as const, error: "Add at least one photo before publishing." };
  }
  const { data: current } = await supabase.from("listings").select("published_at").eq("id", listingId).single();
  const { error } = await supabase
    .from("listings")
    .update({ status, published_at: status === "published" ? (current?.published_at ?? new Date().toISOString()) : current?.published_at })
    .eq("id", listingId);
  if (error) return { ok: false as const, error: "Couldn't update the listing." };
  revalidatePath(`/agent/listings/${listingId}`);
  revalidatePath("/agent");
  return { ok: true as const };
}

// ─── Photos ────────────────────────────────────────────────────────────
export async function registerListingPhoto(input: { folderId: string; path: string; width: number; height: number }) {
  const { profile, supabase } = await agent();
  const parsed = registerPhotoSchema.safeParse(input);
  if (!parsed.success || !isOwnedPhotoPath(parsed.data.path, profile.id, parsed.data.folderId)) {
    return { ok: false as const, error: "Invalid upload" };
  }
  const { folderId: listingId, path, width, height } = parsed.data;
  const { count } = await supabase.from("listing_photos").select("id", { count: "exact", head: true }).eq("listing_id", listingId);
  const { data, error } = await supabase
    .from("listing_photos")
    .insert({ listing_id: listingId, storage_path: path, width, height, sort: count ?? 0 })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: "Couldn't save the photo" };
  if (!count) await supabase.from("listings").update({ cover_photo_path: path }).eq("id", listingId);
  revalidatePath(`/agent/listings/${listingId}`);
  return { ok: true as const, id: data.id };
}

export async function setCoverPhoto(listingId: string, path: string) {
  const { supabase } = await agent();
  await supabase.from("listings").update({ cover_photo_path: path }).eq("id", listingId);
  revalidatePath(`/agent/listings/${listingId}`);
}

export async function updatePhotoLabel(listingId: string, photoId: string, label: string) {
  const { supabase } = await agent();
  await supabase.from("listing_photos").update({ room_label: label.trim().slice(0, 60) || null }).eq("id", photoId).eq("listing_id", listingId);
  revalidatePath(`/agent/listings/${listingId}`);
}

export async function deleteListingPhoto(listingId: string, photoId: string) {
  const { supabase } = await agent();
  const { data: photo } = await supabase.from("listing_photos").select("storage_path").eq("id", photoId).eq("listing_id", listingId).single();
  if (!photo) return;
  await supabase.from("listing_photos").delete().eq("id", photoId);
  await supabase.storage.from(BUCKETS.listings).remove([photo.storage_path]);
  const { data: listing } = await supabase.from("listings").select("cover_photo_path").eq("id", listingId).single();
  if (listing?.cover_photo_path === photo.storage_path) {
    const { data: next } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", listingId).order("sort").limit(1);
    await supabase.from("listings").update({ cover_photo_path: next?.[0]?.storage_path ?? null }).eq("id", listingId);
  }
  revalidatePath(`/agent/listings/${listingId}`);
}
