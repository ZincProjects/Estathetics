/**
 * Seeds demo data: accounts, a designer project (rooms, photos, scan, redesigns) and two
 * published demo listings (HDB 4-room + condo) with neighbourhood reports and copy.
 * Idempotent: re-running replaces the demo users' projects and listings.
 *
 *   npm run seed        (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *
 * Everything runs in mock mode, so no AI keys are used or charged.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "../lib/supabase/database.types";
import { TEST_AGENT, TEST_DESIGNER, TEST_PASSWORD } from "../tests/e2e/test-accounts";

process.env.FORCE_MOCK = "true"; // must be set before importing app modules that read env

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const admin: SupabaseClient<Database> = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type DemoUser = { email: string; name: string; profile: TablesUpdate<"profiles"> };

const DEMO_USERS: DemoUser[] = [
  {
    email: TEST_DESIGNER.email,
    name: TEST_DESIGNER.name,
    profile: {
      role: "interior_designer",
      firm_name: "Studio Linen & Oak (demo)",
      specialties: ["HDB renovation", "Small spaces", "Sustainable design"],
      portfolio_urls: [],
      bio: "Demo designer account: warm, practical interiors for Singapore HDB and condo homes.",
      phone: "+65 9000 0001",
      slug: "demo-designer",
    },
  },
  {
    email: "designer.dev2@example.com",
    name: "Priya Nair (demo)",
    profile: {
      role: "interior_designer",
      firm_name: "Kebun Interiors (demo)",
      specialties: ["Condo", "Luxury", "Heritage / Peranakan"],
      portfolio_urls: [],
      bio: "Demo designer account: Peranakan-inspired modern spaces.",
      slug: "demo-designer-2",
    },
  },
  {
    email: TEST_AGENT.email,
    name: TEST_AGENT.name,
    profile: {
      role: "agent",
      agency_name: "Demo Realty Pte Ltd",
      cea_number: "R000001A", // fictitious, for demo only
      phone: "+65 9000 0002",
      bio: "Demo agent account.",
      slug: "demo-agent",
    },
  },
];

async function findUserByEmail(email: string) {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function upsertUser(u: DemoUser) {
  const existing = await findUserByEmail(u.email);
  let id = existing?.id;
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.name, role: u.profile.role },
    });
    if (error) throw error;
    id = data.user.id;
  } else {
    await admin.auth.admin.updateUserById(id, { password: TEST_PASSWORD });
  }
  const { error } = await admin
    .from("profiles")
    .update({ ...u.profile, full_name: u.name, onboarded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  console.log(`✓ ${u.profile.role} ${u.email}`);
  return id;
}

function must<R extends { data: unknown; error: unknown }>(res: R, what: string): NonNullable<R["data"]> {
  if (res.error || res.data == null) throw new Error(`${what}: ${JSON.stringify(res.error)}`);
  return res.data as NonNullable<R["data"]>;
}

async function upload(bucket: string, path: string, body: Buffer) {
  const { error } = await admin.storage.from(bucket).upload(path, body, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
}

async function clearUserFiles(userId: string) {
  for (const bucket of ["originals", "designs", "listings"]) {
    const { data: top } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
    for (const entry of top ?? []) {
      const prefix = `${userId}/${entry.name}`;
      if (entry.id) {
        await admin.storage.from(bucket).remove([prefix]);
        continue;
      }
      const { data: files } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
      if (files?.length) await admin.storage.from(bucket).remove(files.map((f) => `${prefix}/${f.name}`));
    }
  }
}

const photo = (name: string) => readFileSync(`public/mock/${name}.jpg`);

async function seedDesigner(userId: string) {
  const { mockRoomScan } = await import("../lib/ai/mocks/room-scan");
  const { mockRedesignProvider } = await import("../lib/ai/redesign/mock");
  const { watermark } = await import("../lib/images/watermark");
  const { getPresetTheme } = await import("../lib/themes");

  await admin.from("projects").delete().eq("owner_id", userId);
  await admin.from("themes").delete().eq("owner_id", userId);
  await clearUserFiles(userId);

  const project = must(
    await admin
      .from("projects")
      .insert({
        owner_id: userId,
        title: "Demo: Tan family, Tampines 4-room",
        client_name: "Tan family (demo)",
        property_type: "hdb",
        address: "475 Tampines Street 44",
        notes: "Young family with two kids. They want warm, durable finishes, more storage and a study nook for WFH.",
      })
      .select("id")
      .single(),
    "project",
  );

  const rooms = [
    { name: "Living room", type: "living", img: "room-living" },
    { name: "Master bedroom", type: "master_bedroom", img: "room-bedroom" },
    { name: "Kitchen", type: "kitchen", img: "room-kitchen" },
  ];
  for (const [i, r] of rooms.entries()) {
    const room = must(
      await admin.from("rooms").insert({ owner_id: userId, project_id: project.id, name: r.name, room_type: r.type, sort: i }).select("id").single(),
      "room",
    );
    const path = `${userId}/${room.id}/${randomUUID()}.jpg`;
    const image = photo(r.img);
    await upload("originals", path, image);
    const ph = must(
      await admin.from("room_photos").insert({ owner_id: userId, room_id: room.id, storage_path: path, width: 1200, height: 900, is_primary: true }).select("id").single(),
      "photo",
    );

    if (r.type === "living") {
      await admin.from("room_scans").insert({
        owner_id: userId,
        room_id: room.id,
        photo_id: ph.id,
        data: mockRoomScan(r.type),
        model: "mock",
        prompt_version: "room-scan@1",
      });
      const theme = getPresetTheme("japandi")!;
      const { data: themeRow } = await admin.from("themes").select("id").eq("slug", theme.slug).is("owner_id", null).single();
      const batchId = randomUUID();
      for (const variation of [1, 2]) {
        const designId = randomUUID();
        const out = await mockRedesignProvider.generate({
          image,
          prompt: "",
          negativePrompt: "",
          strength: 0.8,
          seed: variation,
          palette: theme.palette,
          themeSlug: theme.slug,
        });
        const designPath = `${userId}/${designId}.jpg`;
        await upload("designs", designPath, await watermark(out.image));
        await admin.from("designs").insert({
          id: designId,
          owner_id: userId,
          room_id: room.id,
          source_photo_id: ph.id,
          theme_id: themeRow?.id ?? null,
          theme_name: theme.name,
          batch_id: batchId,
          variation,
          status: "ready",
          storage_path: designPath,
          provider: "mock",
          chosen: variation === 1,
        });
      }
    }
  }
  console.log("✓ designer demo project");
}

async function seedAgent(userId: string) {
  const { findNearbyAmenities } = await import("../lib/geo/amenities");
  const { generateListingCopy } = await import("../lib/ai/listing-copy");

  await admin.from("listings").delete().eq("agent_id", userId);
  await clearUserFiles(userId);

  const demos = [
    {
      slug: "demo-tampines-4-room",
      property_type: "hdb" as const,
      title: "Demo: Bright 4-room near Tampines East MRT",
      address: "475 Tampines Street 44",
      postal_code: "520475",
      block: "475",
      lat: 1.360323,
      lng: 103.95313,
      size_sqft: 1001,
      bedrooms: 3,
      bathrooms: 2,
      floor_level: "High",
      facing: "North",
      tenure: "leasehold_99" as const,
      lease_start_year: 1990,
      facilities: [],
      asking_price: 620000,
      highlights: "Demo listing for testing Estathetics. Not a real property for sale.\nRenovated kitchen\nUnblocked view from the living room",
      photos: [
        ["room-living", "Living room"],
        ["room-bedroom", "Master bedroom"],
        ["room-kitchen", "Kitchen"],
      ],
    },
    {
      slug: "demo-bishan-condo",
      property_type: "condo" as const,
      title: "Demo: Family 3-bed condo in Bishan",
      address: "8 Bishan Street 15",
      postal_code: "573910",
      block: "8",
      lat: 1.354312,
      lng: 103.844793,
      size_sqft: 1238,
      bedrooms: 3,
      bathrooms: 2,
      floor_level: "Mid",
      facing: "South-East",
      tenure: "leasehold_99" as const,
      lease_start_year: 2012,
      top_year: 2015,
      facilities: ["Swimming pool", "Gym", "BBQ pits", "Children's playground", "24-hour security"],
      asking_price: 1880000,
      highlights: "Demo listing for testing Estathetics. Not a real property for sale.\nSpacious living and dining area\nBalcony off the living room",
      photos: [
        ["room-living-empty", "Living room"],
        ["room-bedroom-empty", "Bedroom"],
        ["room-kitchen-empty", "Kitchen"],
      ],
    },
  ];

  for (const { photos, ...d } of demos) {
    const listing = must(
      await admin
        .from("listings")
        .insert({ ...d, agent_id: userId, status: "published", published_at: new Date().toISOString() })
        .select("*")
        .single(),
      "listing",
    );
    for (const [i, [img, label]] of photos.entries()) {
      const path = `${userId}/${listing.id}/${randomUUID()}.jpg`;
      await upload("listings", path, photo(img));
      await admin.from("listing_photos").insert({ agent_id: userId, listing_id: listing.id, storage_path: path, room_label: label, sort: i, width: 1200, height: 900 });
      if (i === 0) await admin.from("listings").update({ cover_photo_path: path }).eq("id", listing.id);
    }

    const { amenities } = await findNearbyAmenities({ lat: d.lat, lng: d.lng });
    const rows = amenities.map((a) => ({
      listing_id: listing.id,
      category: a.category,
      name: a.name,
      lat: a.lat,
      lng: a.lng,
      distance_m: a.distanceM,
      walk_minutes: a.walkMinutes,
      source: a.source,
    }));
    if (rows.length) await admin.from("listing_amenities").insert(rows);

    const { copy, promptVersion } = await generateListingCopy({
      listing,
      amenities: rows.map((r) => ({ category: r.category, name: r.name, walk_minutes: r.walk_minutes, distance_m: r.distance_m })),
      tone: d.property_type === "hdb" ? "warm" : "professional",
    });
    await admin.from("listing_content").insert({
      agent_id: userId,
      listing_id: listing.id,
      kind: "listing_copy",
      tone: d.property_type === "hdb" ? "warm" : "professional",
      data: { ...copy, warnings: [], model: "mock" },
      prompt_version: promptVersion,
      is_current: true,
    });
    console.log(`✓ listing /l/${d.slug} (${rows.length} amenities)`);
  }
}

async function main() {
  const ids: Record<string, string> = {};
  for (const u of DEMO_USERS) ids[u.email] = await upsertUser(u);
  await seedDesigner(ids[TEST_DESIGNER.email]);
  await seedAgent(ids[TEST_AGENT.email]);
  console.log("\nDemo data ready. Accounts use TEST_PASSWORD from tests/e2e/test-accounts.ts.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
