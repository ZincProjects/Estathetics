// Copies MapLibre's web worker into /public so the browser can load it.
// Turbopack doesn't bundle MapLibre 6's module worker, so we serve it statically.
import { copyFileSync, mkdirSync } from "node:fs";

const out = "public/vendor/maplibre";
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`node_modules/maplibre-gl/dist/${f}`, `${out}/${f}`);
}
console.log("maplibre worker copied to", out);
