export const AMENITY_CATEGORIES = {
  mrt: { label: "MRT / LRT", plural: "MRT / LRT stations", radius: 2000, limit: 4, icon: "train" },
  bus: { label: "Bus stop", plural: "Bus stops", radius: 400, limit: 4, icon: "bus" },
  mall: { label: "Mall", plural: "Shopping malls", radius: 2000, limit: 4, icon: "shopping-bag" },
  hawker: { label: "Hawker centre", plural: "Hawker centres", radius: 2000, limit: 4, icon: "utensils" },
  supermarket: { label: "Supermarket", plural: "Supermarkets", radius: 1000, limit: 4, icon: "shopping-cart" },
  primary_school: { label: "Primary school", plural: "Primary schools (within 1 km & 2 km)", radius: 2000, limit: 10, icon: "school" },
  park: { label: "Park", plural: "Parks", radius: 2000, limit: 4, icon: "trees" },
  clinic: { label: "Clinic", plural: "Clinics & polyclinics", radius: 1500, limit: 4, icon: "stethoscope" },
  hospital: { label: "Hospital", plural: "Hospitals", radius: 5000, limit: 2, icon: "hospital" },
} as const;

export type AmenityCategory = keyof typeof AMENITY_CATEGORIES;
export const CATEGORY_ORDER = Object.keys(AMENITY_CATEGORIES) as AmenityCategory[];
