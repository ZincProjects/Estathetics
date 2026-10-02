import "server-only";
import dataset from "@/data/sg-amenities.json";
import { env, mock } from "@/lib/env";
import { AMENITY_CATEGORIES, CATEGORY_ORDER, type AmenityCategory } from "./categories";
import { estimateWalk, haversineMeters } from "./distance";

export type NearbyAmenity = {
  category: AmenityCategory;
  name: string;
  lat: number;
  lng: number;
  distanceM: number; // estimated walking distance
  walkMinutes: number;
  source: "dataset" | "onemap" | "google";
};

type Point = { lat: number; lng: number };
type Candidate = { name: string; lat: number; lng: number; source: NearbyAmenity["source"] };

/** Keep the nearest `limit` candidates within `radius` (straight-line) metres. */
export function rankNearby(origin: Point, category: AmenityCategory, candidates: Candidate[]): NearbyAmenity[] {
  const { radius, limit } = AMENITY_CATEGORIES[category];
  const seen = new Set<string>();
  return candidates
    .map((c) => ({ c, straight: haversineMeters(origin, c) }))
    .filter(({ straight }) => straight <= radius)
    .sort((a, b) => a.straight - b.straight)
    .filter(({ c }) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ c, straight }) => {
      const walk = estimateWalk(straight);
      return { category, name: c.name, lat: c.lat, lng: c.lng, distanceM: walk.meters, walkMinutes: walk.minutes, source: c.source };
    });
}

// ─── Source 1: bundled OneMap dataset (always available) ──────────────
function fromDataset(category: AmenityCategory): Candidate[] {
  return dataset.amenities.filter((a) => a.c === category).map((a) => ({ name: a.n, lat: a.lat, lng: a.lng, source: "dataset" as const }));
}

// ─── Source 2: OneMap themes / nearby API (needs a free OneMap account) ─
let onemapToken: { value: string; expires: number } | null = null;
async function getOneMapToken() {
  if (mock.onemapAuth) return null;
  if (onemapToken && onemapToken.expires > Date.now() + 60_000) return onemapToken.value;
  const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.ONEMAP_EMAIL, password: env.ONEMAP_PASSWORD }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OneMap auth ${res.status}`);
  const body = (await res.json()) as { access_token: string; expiry_timestamp: string };
  onemapToken = { value: body.access_token, expires: Number(body.expiry_timestamp) * 1000 };
  return onemapToken.value;
}

/** OneMap theme names per category (see OneMap getAllThemesInfo). */
const ONEMAP_THEMES: Partial<Record<AmenityCategory, string>> = {
  supermarket: "supermarkets",
  park: "nationalparks",
  clinic: "moh_isp_clinics",
  hawker: "hawkercentre",
};

async function fromOneMapTheme(origin: Point, category: AmenityCategory, token: string): Promise<Candidate[]> {
  const theme = ONEMAP_THEMES[category];
  if (!theme) return [];
  const d = AMENITY_CATEGORIES[category].radius / 111_000; // degrees, roughly
  const extents = [origin.lat - d, origin.lng - d, origin.lat + d, origin.lng + d].join(",");
  const res = await fetch(
    `https://www.onemap.gov.sg/api/public/themesvc/retrieveTheme?queryName=${theme}&extents=${extents}`,
    { headers: { Authorization: token }, signal: AbortSignal.timeout(8000), next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error(`OneMap theme ${theme} ${res.status}`);
  const body = (await res.json()) as { SrchResults?: Record<string, string>[] };
  return (body.SrchResults ?? [])
    .slice(1) // first entry is metadata
    .filter((r) => r.LatLng && r.NAME)
    .map((r) => {
      const [lat, lng] = r.LatLng.split(",").map(Number);
      return { name: r.NAME, lat, lng, source: "onemap" as const };
    });
}

async function fromOneMapBusStops(origin: Point, token: string): Promise<Candidate[]> {
  const res = await fetch(
    `https://www.onemap.gov.sg/api/public/nearbysvc/getNearestBusStops?latitude=${origin.lat}&longitude=${origin.lng}&radius_in_meters=${AMENITY_CATEGORIES.bus.radius}`,
    { headers: { Authorization: token }, signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) throw new Error(`OneMap bus ${res.status}`);
  const body = (await res.json()) as { name?: string; lat?: string | number; lon?: string | number; id?: string }[];
  return (Array.isArray(body) ? body : [])
    .filter((b) => b.lat && b.lon)
    .map((b) => ({ name: [b.name, b.id && `(${b.id})`].filter(Boolean).join(" "), lat: Number(b.lat), lng: Number(b.lon), source: "onemap" as const }));
}

// ─── Source 3: Google Places (optional fallback) ──────────────────────
const GOOGLE_TYPES: Partial<Record<AmenityCategory, string[]>> = {
  mrt: ["subway_station", "light_rail_station"],
  bus: ["bus_stop"],
  mall: ["shopping_mall"],
  supermarket: ["supermarket"],
  primary_school: ["primary_school"],
  park: ["park"],
  clinic: ["doctor", "medical_clinic"],
  hospital: ["hospital"],
  hawker: ["food_court"],
};

async function fromGoogle(origin: Point, category: AmenityCategory): Promise<Candidate[]> {
  const types = GOOGLE_TYPES[category];
  if (!types || mock.places) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask": "places.displayName,places.location",
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: { latitude: origin.lat, longitude: origin.lng }, radius: AMENITY_CATEGORIES[category].radius } },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}`);
  const body = (await res.json()) as { places?: { displayName: { text: string }; location: { latitude: number; longitude: number } }[] };
  return (body.places ?? []).map((p) => ({ name: p.displayName.text, lat: p.location.latitude, lng: p.location.longitude, source: "google" as const }));
}

/**
 * Builds the neighbourhood report. Per category, sources are tried in order of
 * quality (OneMap live → bundled dataset → Google) and merged; failures are skipped.
 */
export async function findNearbyAmenities(origin: Point): Promise<{ amenities: NearbyAmenity[]; sources: string[] }> {
  const token = await getOneMapToken().catch((e) => {
    console.warn("OneMap auth failed:", e instanceof Error ? e.message : e);
    return null;
  });
  const used = new Set<string>(["dataset"]);

  const perCategory = await Promise.all(
    CATEGORY_ORDER.map(async (category) => {
      const candidates: Candidate[] = fromDataset(category);
      const live: Promise<Candidate[]>[] = [];
      if (token && category === "bus") live.push(fromOneMapBusStops(origin, token));
      if (token && ONEMAP_THEMES[category]) live.push(fromOneMapTheme(origin, category, token));
      if (!mock.places && (candidates.length === 0 || !token)) live.push(fromGoogle(origin, category));
      for (const r of await Promise.allSettled(live)) {
        if (r.status === "fulfilled") {
          candidates.push(...r.value);
          r.value.forEach((c) => used.add(c.source));
        } else console.warn(`amenities ${category}:`, r.reason instanceof Error ? r.reason.message : r.reason);
      }
      return rankNearby(origin, category, candidates);
    }),
  );
  return { amenities: perCategory.flat(), sources: [...used] };
}
