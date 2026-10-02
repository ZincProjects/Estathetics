import { Footprints } from "lucide-react";
import { AMENITY_CATEGORIES, CATEGORY_ORDER, type AmenityCategory } from "@/lib/geo/categories";
import { formatDistance } from "@/lib/geo/distance";
import { AmenityMap } from "./amenity-map";

export type AmenityRow = {
  category: string;
  name: string;
  lat: number;
  lng: number;
  distance_m: number;
  walk_minutes: number;
  source: string;
};

/** Map + grouped list. Used in the Listing Studio and on public listing pages. */
export function NeighbourhoodReport({ home, amenities }: { home: { lat: number; lng: number; label: string }; amenities: AmenityRow[] }) {
  const byCat = new Map<AmenityCategory, AmenityRow[]>();
  for (const a of amenities) {
    if (!(a.category in AMENITY_CATEGORIES)) continue;
    const k = a.category as AmenityCategory;
    byCat.set(k, [...(byCat.get(k) ?? []), a].sort((x, y) => x.distance_m - y.distance_m));
  }
  const sources = new Set(amenities.map((a) => a.source));

  return (
    <div className="space-y-5">
      <AmenityMap
        home={home}
        points={amenities.map((a) => ({ name: a.name, lat: a.lat, lng: a.lng, category: a.category, walkMinutes: a.walk_minutes }))}
        className="h-72 w-full overflow-hidden rounded-xl border border-border sm:h-96"
      />
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => {
          const rows = byCat.get(c)!;
          const isSchool = c === "primary_school";
          return (
            <section key={c} className="space-y-2">
              <h3 className="font-sans text-sm font-semibold">{AMENITY_CATEGORIES[c].plural}</h3>
              <ul className="space-y-1.5 text-sm">
                {rows.map((a) => (
                  <li key={`${a.name}-${a.lat}`} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate">{a.name}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Footprints className="size-3" />
                      {a.walk_minutes} min · {formatDistance(a.distance_m)}
                      {isSchool && <span className="ml-1 rounded bg-secondary px-1">{a.distance_m <= 1300 ? "≤1 km" : "1–2 km"}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Walking times are estimates (straight-line distance × 1.3 at about 4.8 km/h). Primary school bands use straight-line
        distance as a guide only; check MOE&apos;s official tool for P1 registration. Data:{" "}
        {[...sources].map((s) => (s === "dataset" || s === "onemap" ? "OneMap / SLA" : "Google")).filter((v, i, arr) => arr.indexOf(v) === i).join(", ")}.
      </p>
    </div>
  );
}
