import "server-only";

/** A geocoded Singapore address from OneMap (or the mock fallback). */
export type GeoAddress = {
  label: string;
  block: string | null;
  road: string;
  building: string | null;
  postalCode: string | null;
  lat: number;
  lng: number;
  source: "onemap" | "mock";
};

type OneMapResult = {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  LATITUDE: string;
  LONGITUDE: string;
};

const MOCK_ADDRESSES: GeoAddress[] = [
  { label: "475 Tampines Street 44, Singapore 520475", block: "475", road: "Tampines Street 44", building: null, postalCode: "520475", lat: 1.3591, lng: 103.9536, source: "mock" },
  { label: "201C Tampines Street 21, Singapore 523201", block: "201C", road: "Tampines Street 21", building: null, postalCode: "523201", lat: 1.3584, lng: 103.9512, source: "mock" },
  { label: "8 Bishan Street 15, Sky Habitat, Singapore 573910", block: "8", road: "Bishan Street 15", building: "Sky Habitat", postalCode: "573910", lat: 1.3543, lng: 103.8448, source: "mock" },
  { label: "260 Bishan Street 22, Singapore 570260", block: "260", road: "Bishan Street 22", building: null, postalCode: "570260", lat: 1.3592, lng: 103.8457, source: "mock" },
  { label: "1 Punggol Field Walk, Singapore 828742", block: "1", road: "Punggol Field Walk", building: null, postalCode: "828742", lat: 1.3995, lng: 103.9123, source: "mock" },
];

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * OneMap elastic search: public, no token needed. Falls back to a small mock list
 * when OneMap is unreachable so the app stays usable offline and in tests.
 */
export async function searchAddress(query: string, limit = 6): Promise<GeoAddress[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (process.env.FORCE_MOCK === "true") return mockSearch(q, limit);

  try {
    const url = new URL("https://www.onemap.gov.sg/api/common/elastic/search");
    url.search = new URLSearchParams({ searchVal: q, returnGeom: "Y", getAddrDetails: "Y", pageNum: "1" }).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`OneMap ${res.status}`);
    const body = (await res.json()) as { results?: OneMapResult[] };
    return (body.results ?? []).slice(0, limit).map((r) => {
      const block = r.BLK_NO && r.BLK_NO !== "NIL" ? r.BLK_NO : null;
      const building = r.BUILDING && r.BUILDING !== "NIL" ? titleCase(r.BUILDING) : null;
      const road = titleCase(r.ROAD_NAME);
      const postal = r.POSTAL && r.POSTAL !== "NIL" ? r.POSTAL : null;
      return {
        label: [block ? `${block} ${road}` : road, building, postal ? `Singapore ${postal}` : null].filter(Boolean).join(", "),
        block,
        road,
        building,
        postalCode: postal,
        lat: Number(r.LATITUDE),
        lng: Number(r.LONGITUDE),
        source: "onemap" as const,
      };
    });
  } catch (e) {
    console.warn("[mock] OneMap search unavailable, using mock addresses:", e instanceof Error ? e.message : e);
    return mockSearch(q, limit);
  }
}

function mockSearch(q: string, limit: number) {
  const needle = q.toLowerCase();
  const hits = MOCK_ADDRESSES.filter((a) => a.label.toLowerCase().includes(needle));
  return (hits.length ? hits : MOCK_ADDRESSES).slice(0, limit);
}
