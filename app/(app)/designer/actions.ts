"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { fieldErrors, type FormState } from "@/lib/forms";
import { isOwnedPhotoPath, projectSchema, registerPhotoSchema, roomSchema } from "@/lib/schemas/project";
import { roomScanSchema } from "@/lib/schemas/room-scan";
import { BUCKETS } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

async function designer() {
  const profile = await requireProfile(["interior_designer"]);
  return { profile, supabase: await createClient() };
}

// ─── Projects ──────────────────────────────────────────────────────────
export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await designer();
  const raw = Object.fromEntries(formData);
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const { title, clientName, propertyType, address, notes } = parsed.data;
  const { data, error } = await supabase
    .from("projects")
    .insert({ title, client_name: clientName, property_type: propertyType, address, notes })
    .select("id")
    .single();
  if (error) return { message: "Couldn't create the project. Please try again.", values: raw };

  revalidatePath("/designer");
  redirect(`/designer/projects/${data.id}`);
}

export async function updateProject(projectId: string, _: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await designer();
  const raw = Object.fromEntries(formData);
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const { title, clientName, propertyType, address, notes } = parsed.data;
  const { error } = await supabase
    .from("projects")
    .update({ title, client_name: clientName, property_type: propertyType, address, notes })
    .eq("id", projectId);
  if (error) return { message: "Couldn't save changes.", values: raw };

  revalidatePath(`/designer/projects/${projectId}`);
  return { ok: true, message: "Saved" };
}

export async function deleteProject(projectId: string) {
  const { profile, supabase } = await designer();
  // Collect storage objects first; DB rows cascade but files don't.
  const { data: photos } = await supabase
    .from("room_photos")
    .select("storage_path, rooms!inner(project_id)")
    .eq("rooms.project_id", projectId);
  await supabase.from("projects").delete().eq("id", projectId).eq("owner_id", profile.id);
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length) await supabase.storage.from(BUCKETS.originals).remove(paths);
  revalidatePath("/designer");
  redirect("/designer");
}

// ─── Rooms ─────────────────────────────────────────────────────────────
export async function createRoom(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await designer();
  const raw = Object.fromEntries(formData);
  const parsed = roomSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const { projectId, name, roomType } = parsed.data;
  const { count } = await supabase.from("rooms").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const { data, error } = await supabase
    .from("rooms")
    .insert({ project_id: projectId, name, room_type: roomType, sort: count ?? 0 })
    .select("id")
    .single();
  if (error) return { message: "Couldn't add the room.", values: raw };

  revalidatePath(`/designer/projects/${projectId}`);
  redirect(`/designer/projects/${projectId}/rooms/${data.id}`);
}

export async function deleteRoom(projectId: string, roomId: string) {
  const { supabase } = await designer();
  const { data: photos } = await supabase.from("room_photos").select("storage_path").eq("room_id", roomId);
  await supabase.from("rooms").delete().eq("id", roomId);
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length) await supabase.storage.from(BUCKETS.originals).remove(paths);
  revalidatePath(`/designer/projects/${projectId}`);
  redirect(`/designer/projects/${projectId}`);
}

// ─── Photos ────────────────────────────────────────────────────────────
/** Called by the browser after it uploads a resized JPEG straight to Storage. */
export async function registerPhoto(input: { roomId: string; path: string; width: number; height: number }) {
  const { profile, supabase } = await designer();
  const parsed = registerPhotoSchema.safeParse(input);
  if (!parsed.success || !isOwnedPhotoPath(parsed.data.path, profile.id, parsed.data.roomId)) {
    return { ok: false as const, error: "Invalid upload" };
  }
  const { roomId, path, width, height } = parsed.data;

  const { data: room } = await supabase.from("rooms").select("id, project_id").eq("id", roomId).single();
  if (!room) return { ok: false as const, error: "Room not found" };

  const { count } = await supabase.from("room_photos").select("id", { count: "exact", head: true }).eq("room_id", roomId);
  const { data, error } = await supabase
    .from("room_photos")
    .insert({ room_id: roomId, storage_path: path, width, height, is_primary: (count ?? 0) === 0 })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: "Couldn't save the photo" };

  revalidatePath(`/designer/projects/${room.project_id}/rooms/${roomId}`);
  revalidatePath(`/designer/projects/${room.project_id}`);
  return { ok: true as const, id: data.id };
}

export async function setPrimaryPhoto(roomId: string, photoId: string) {
  const { supabase } = await designer();
  await supabase.from("room_photos").update({ is_primary: false }).eq("room_id", roomId);
  await supabase.from("room_photos").update({ is_primary: true }).eq("id", photoId).eq("room_id", roomId);
  const { data: room } = await supabase.from("rooms").select("project_id").eq("id", roomId).single();
  if (room) revalidatePath(`/designer/projects/${room.project_id}/rooms/${roomId}`);
}

export async function deletePhoto(roomId: string, photoId: string) {
  const { supabase } = await designer();
  const { data: photo } = await supabase
    .from("room_photos")
    .select("storage_path, is_primary")
    .eq("id", photoId)
    .eq("room_id", roomId)
    .single();
  if (!photo) return;
  await supabase.from("room_photos").delete().eq("id", photoId);
  await supabase.storage.from(BUCKETS.originals).remove([photo.storage_path]);
  if (photo.is_primary) {
    const { data: next } = await supabase.from("room_photos").select("id").eq("room_id", roomId).order("created_at").limit(1);
    if (next?.[0]) await supabase.from("room_photos").update({ is_primary: true }).eq("id", next[0].id);
  }
  const { data: room } = await supabase.from("rooms").select("project_id").eq("id", roomId).single();
  if (room) revalidatePath(`/designer/projects/${room.project_id}/rooms/${roomId}`);
}

// ─── Scans ─────────────────────────────────────────────────────────────
export async function updateScan(scanId: string, data: unknown) {
  const { supabase } = await designer();
  const parsed = roomScanSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: "Some fields are invalid." };
  const { data: row, error } = await supabase
    .from("room_scans")
    .update({ data: parsed.data, edited_at: new Date().toISOString() })
    .eq("id", scanId)
    .select("room_id, rooms(project_id)")
    .single();
  if (error || !row) return { ok: false as const, error: "Couldn't save the scan." };
  revalidatePath(`/designer/projects/${row.rooms?.project_id}/rooms/${row.room_id}`);
  return { ok: true as const };
}
