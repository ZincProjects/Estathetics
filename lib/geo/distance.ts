/** Great-circle distance in metres. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Street routes are longer than straight lines; 1.3× is a common urban detour factor. */
export const DETOUR_FACTOR = 1.3;
/** Average walking pace (~4.8 km/h). */
export const WALK_METERS_PER_MIN = 80;

/** Approximate walking distance and time from a straight-line distance. */
export function estimateWalk(straightMeters: number) {
  const meters = Math.round(straightMeters * DETOUR_FACTOR);
  return { meters, minutes: Math.max(1, Math.round(meters / WALK_METERS_PER_MIN)) };
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
