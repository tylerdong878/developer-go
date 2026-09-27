import type { LatLon } from "@/content/types";

export type MapLabel = LatLon & {
  name: string;
  /** 1 shows at every zoom, 2 once you zoom in. */
  tier: 1 | 2;
  water?: boolean;
};

// Approximate neighborhood centers. Labels are decoration, so close is fine.
export const labels: MapLabel[] = [
  { name: "Cambridge", lat: 42.3712, lon: -71.1045, tier: 1 },
  { name: "Back Bay", lat: 42.3503, lon: -71.081, tier: 1 },
  { name: "Seaport", lat: 42.3486, lon: -71.0405, tier: 1 },
  { name: "Fenway", lat: 42.3428, lon: -71.0998, tier: 1 },
  { name: "South Boston", lat: 42.3334, lon: -71.0495, tier: 1 },
  { name: "Charlestown", lat: 42.3782, lon: -71.0602, tier: 1 },
  { name: "East Boston", lat: 42.3748, lon: -71.0355, tier: 1 },
  { name: "Brookline", lat: 42.3318, lon: -71.1212, tier: 1 },
  { name: "Dedham", lat: 42.2418, lon: -71.1662, tier: 1 },
  { name: "Westwood", lat: 42.2139, lon: -71.2245, tier: 1 },
  { name: "Wellesley", lat: 42.2965, lon: -71.2924, tier: 1 },
  { name: "Boston Harbor", lat: 42.338, lon: -70.99, tier: 1, water: true },

  { name: "South End", lat: 42.3418, lon: -71.0746, tier: 2 },
  { name: "Allston", lat: 42.3539, lon: -71.1337, tier: 2 },
  { name: "Jamaica Plain", lat: 42.3097, lon: -71.1151, tier: 2 },
  { name: "Roxbury", lat: 42.3152, lon: -71.0914, tier: 2 },
  { name: "Dorchester", lat: 42.3016, lon: -71.0676, tier: 2 },
  { name: "Somerville", lat: 42.3876, lon: -71.0995, tier: 2 },
  { name: "Newton", lat: 42.337, lon: -71.2092, tier: 2 },
  { name: "Needham", lat: 42.2809, lon: -71.2378, tier: 2 },
  { name: "Quincy", lat: 42.2529, lon: -71.0023, tier: 2 },
  { name: "Milton", lat: 42.2495, lon: -71.0662, tier: 2 },
  { name: "Charles River", lat: 42.3558, lon: -71.0905, tier: 2, water: true },
];
