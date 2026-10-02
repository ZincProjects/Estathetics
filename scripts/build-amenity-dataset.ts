/**
 * Builds data/sg-amenities.json from OneMap's public search API (no token needed).
 * Covers categories that OneMap search indexes well; others come from OneMap themes
 * or Google Places at runtime when credentials are configured.
 *
 *   npx tsx scripts/build-amenity-dataset.ts
 *
 * Data © OneMap / Singapore Land Authority, Singapore Open Data Licence.
 */
import { writeFileSync } from "node:fs";

type Row = { SEARCHVAL: string; LATITUDE: string; LONGITUDE: string };
type Amenity = { c: string; n: string; lat: number; lng: number };

const NOT_PLACE = /\b(BUS STOP|OPP|AFT|BEF|EXIT|CARPARK|CAR PARK|TAXI)\b/;

const QUERIES: { category: string; q: string; keep: (name: string) => boolean }[] = [
  { category: "mrt", q: "MRT STATION", keep: (n) => /\bMRT STATION\b/.test(n) && !NOT_PLACE.test(n) && !/DEPOT/.test(n) },
  { category: "mrt", q: "LRT STATION", keep: (n) => /\bLRT STATION\b/.test(n) && !NOT_PLACE.test(n) },
  { category: "hawker", q: "HAWKER CENTRE", keep: (n) => /HAWKER CENTRE|FOOD CENTRE/.test(n) && !NOT_PLACE.test(n) },
  { category: "hawker", q: "FOOD CENTRE", keep: (n) => /FOOD CENTRE|HAWKER CENTRE/.test(n) && !/COURT/.test(n) && !NOT_PLACE.test(n) },
  {
    category: "primary_school",
    q: "PRIMARY SCHOOL",
    keep: (n) => /PRIMARY SCHOOL( \(.*\))?$/.test(n) && !/@|STUDENT CARE|KINDERGARTEN|CHILDCARE/.test(n) && !NOT_PLACE.test(n),
  },
  {
    category: "hospital",
    q: "HOSPITAL",
    keep: (n) => /HOSPITAL$/.test(n) && !/VETERINARY|ANIMAL|\bPET\b|EQUINE|DIALYSIS|HISTORIC/.test(n) && !NOT_PLACE.test(n),
  },
  { category: "clinic", q: "POLYCLINIC", keep: (n) => /POLYCLINIC$/.test(n) },
  {
    category: "mall",
    q: "SHOPPING CENTRE",
    keep: (n) => /^[A-Z][A-Z0-9' &.-]* (SHOPPING CENTRE|MALL)$/.test(n) && !n.includes(" - ") && !NOT_PLACE.test(n),
  },
  {
    category: "mall",
    q: "MALL",
    keep: (n) => /^[A-Z][A-Z0-9' &.-]* MALL$/.test(n) && !n.includes(" - ") && !/SMALL/.test(n) && !NOT_PLACE.test(n),
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function page(q: string, n: number) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=N&pageNum=${n}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return (await res.json()) as { totalNumPages: number; results: Row[] };
    } catch {
      // network hiccup: fall through to backoff
    }
    await sleep(3000 * 2 ** attempt); // OneMap throttles bursts
  }
  throw new Error(`OneMap failed for ${q} page ${n}`);
}

/** "TAMPINES MRT STATION (EW2 / DT32)" → "Tampines MRT Station (EW2 / DT32)" */
function tidy(name: string) {
  return name
    .toLowerCase()
    .replace(/(^|[\s(/-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase())
    .replace(/\b(Mrt|Lrt)\b/g, (m) => m.toUpperCase())
    .replace(/\(([a-z0-9 /]+)\)/gi, (m) => m.toUpperCase());
}

async function main() {
  const out = new Map<string, Amenity>();
  for (const { category, q, keep } of QUERIES) {
    const first = await page(q, 1);
    const pages = Math.min(first.totalNumPages, 80);
    const rows = [...first.results];
    for (let n = 2; n <= pages; n++) {
      rows.push(...(await page(q, n)).results);
      await sleep(350);
    }
    let kept = 0;
    for (const r of rows) {
      if (!keep(r.SEARCHVAL)) continue;
      const name = tidy(r.SEARCHVAL);
      const key = `${category}:${name}`;
      if (out.has(key)) continue;
      out.set(key, { c: category, n: name, lat: Number(Number(r.LATITUDE).toFixed(6)), lng: Number(Number(r.LONGITUDE).toFixed(6)) });
      kept++;
    }
    console.log(`${q}: ${rows.length} rows, kept ${kept}`);
  }

  // Interchanges appear once per line ("Bishan MRT Station (NS17)", "(CC15)", and a bare entry):
  // merge them into one station that lists every line code.
  const merged = new Map<string, Amenity & { codes: Set<string> }>();
  for (const a of out.values()) {
    if (a.c !== "mrt") continue;
    const base = a.n.replace(/\s*\(.*\)$/, "");
    const codes = (a.n.match(/\(([^)]*)\)/)?.[1] ?? "").split("/").map((x) => x.trim()).filter(Boolean);
    const m = merged.get(base) ?? merged.set(base, { ...a, n: base, codes: new Set<string>() }).get(base)!;
    codes.forEach((c) => m.codes.add(c));
  }
  for (const k of [...out.keys()]) if (k.startsWith("mrt:")) out.delete(k);
  for (const [base, m] of merged) {
    const codes = [...m.codes].sort();
    out.set(`mrt:${base}`, { c: "mrt", n: codes.length ? `${base} (${codes.join(" / ")})` : base, lat: m.lat, lng: m.lng });
  }

  // Shops inside a mall are indexed as "<Shop> <Mall Name>". Drop any mall entry that
  // ends with another mall's name, and anything implausibly long.
  // When several entries share a "<X> Mall" suffix that isn't listed itself, they are shops
  // in mall X: collapse them into a single mall entry.
  const mallEntries = [...out.entries()].filter(([, a]) => a.c === "mall");
  const suffixCount = new Map<string, number>();
  for (const [, a] of mallEntries) {
    const words = a.n.split(" ");
    for (let len = 2; len <= 4 && len < words.length; len++) {
      const suffix = words.slice(-len).join(" ");
      suffixCount.set(suffix, (suffixCount.get(suffix) ?? 0) + 1);
    }
  }
  const malls = new Set(mallEntries.map(([, a]) => a.n));
  const GENERIC = /^(The )?(Shopping Centre|Shopping Mall|\w+ Mall|\w+ Shopping Centre)$/;
  for (const [k, a] of mallEntries) {
    const words = a.n.split(" ");
    const host = [2, 3, 4]
      .filter((len) => len < words.length)
      .map((len) => words.slice(-len).join(" "))
      .find(
        (s) =>
          (malls.has(s) && !/^(Shopping Centre|Shopping Mall)$/.test(s)) ||
          (s.split(" ").length >= 3 && !GENERIC.test(s) && (suffixCount.get(s) ?? 0) >= 3),
      );
    if (host) {
      out.delete(k);
      if (!out.has(`mall:${host}`)) out.set(`mall:${host}`, { ...a, n: host });
    } else if (words.length > 6) {
      out.delete(k);
    }
  }

  const data = {
    source: "OneMap / Singapore Land Authority (Singapore Open Data Licence)",
    generatedAt: new Date().toISOString().slice(0, 10),
    amenities: [...out.values()].sort((a, b) => a.c.localeCompare(b.c) || a.n.localeCompare(b.n)),
  };
  writeFileSync("data/sg-amenities.json", JSON.stringify(data));
  console.log(`wrote ${data.amenities.length} amenities`);
}

main();
