"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export type MapPoint = { name: string; lat: number; lng: number; category: string; walkMinutes: number };

const CATEGORY_COLOUR: Record<string, string> = {
  mrt: "#c0392b",
  bus: "#7f8c8d",
  mall: "#8e44ad",
  hawker: "#d35400",
  supermarket: "#27ae60",
  primary_school: "#2980b9",
  park: "#2e7d32",
  clinic: "#16a085",
  hospital: "#c2185b",
};

/**
 * MapLibre map on OneMap's free raster basemap. Loaded on the client only;
 * markers are plain DOM elements so they inherit our styles.
 */
export function AmenityMap({ home, points, className }: { home: { lat: number; lng: number; label: string }; points: MapPoint[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !ref.current) return;
      maplibre.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs"); // copied by scripts/vendor-maplibre.mjs
      const m = new maplibre.Map({
        container: ref.current,
        style: {
          version: 8,
          sources: {
            onemap: {
              type: "raster",
              tiles: ["https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png"],
              tileSize: 256,
              minzoom: 11,
              maxzoom: 19,
              attribution:
                '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:14px;width:14px;display:inline"/> <a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener">OneMap</a> © contributors | <a href="https://www.sla.gov.sg/" target="_blank" rel="noopener">Singapore Land Authority</a>',
            },
          },
          layers: [{ id: "onemap", type: "raster", source: "onemap" }],
        },
        center: [home.lng, home.lat],
        zoom: 15,
        minZoom: 11,
        maxZoom: 18,
        maxBounds: [
          [103.55, 1.15],
          [104.1, 1.48],
        ],
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map = m;
      m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

      const homeEl = document.createElement("div");
      homeEl.className = "flex size-9 items-center justify-center rounded-full border-2 border-white bg-neutral-900 text-white shadow-lg";
      homeEl.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>';
      homeEl.setAttribute("aria-label", home.label);
      new maplibre.Marker({ element: homeEl }).setLngLat([home.lng, home.lat]).addTo(m);

      const bounds = new maplibre.LngLatBounds([home.lng, home.lat], [home.lng, home.lat]);
      for (const p of points) {
        const el = document.createElement("div");
        el.className = "size-3.5 rounded-full border-2 border-white shadow";
        el.style.backgroundColor = CATEGORY_COLOUR[p.category] ?? "#555";
        const popup = new maplibre.Popup({ offset: 10, closeButton: false }).setText(`${p.name} · ${p.walkMinutes} min walk`);
        new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m);
        if (p.walkMinutes <= 20) bounds.extend([p.lng, p.lat]);
      }
      m.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [home.lat, home.lng, home.label, points]);

  return <div ref={ref} className={className} role="region" aria-label="Map of nearby amenities" />;
}

export { CATEGORY_COLOUR };
