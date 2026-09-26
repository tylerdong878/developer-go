import type { LatLon, SignpostId } from "./types";

/**
 * Anchor points around Greater Boston, from OpenStreetMap/Nominatim
 * (checked Sep 2026). Marked ones are approximate and get tuned on the map.
 */
export const places = {
  stateHouse: { lat: 42.35817, lon: -71.06369 },
  financialDistrict: { lat: 42.35643, lon: -71.05572 }, // Post Office Square
  awsSeaport: { lat: 42.35003, lon: -71.04514 }, // 111 Harbor Way
  childrensMuseum: { lat: 42.35185, lon: -71.04965 },
  philips: { lat: 42.37258, lon: -71.07449 }, // 222 Jacobs St, Cambridge Crossing
  northeastern: { lat: 42.33833, lon: -71.08794 }, // Snell Library
  stetsonEast: { lat: 42.34141, lon: -71.09021 },
  buGsu: { lat: 42.35097, lon: -71.10898 }, // George Sherman Union
  buCds: { lat: 42.35002, lon: -71.10311 }, // Computing & Data Sciences
  harvardSoch: { lat: 42.38079, lon: -71.12481 },
  bostonCommon: { lat: 42.35609, lon: -71.06571 }, // Frog Pond
  esplanade: { lat: 42.3573, lon: -71.0737 }, // Hatch Shell
  fenway: { lat: 42.34639, lon: -71.09778 },
  tdGarden: { lat: 42.3662, lon: -71.0621 }, // approximate
  quincyMarket: { lat: 42.36, lon: -71.0548 }, // approximate
  franklinParkZoo: { lat: 42.3025, lon: -71.0877 }, // approximate
  rockSpotSouthBoston: { lat: 42.3365, lon: -71.05646 },
  westwood: { lat: 42.22842, lon: -71.2208 }, // town hall
  babson: { lat: 42.29796, lon: -71.26634 }, // Horn Library
} as const satisfies Record<string, LatLon>;

/** Where the map is centered and distances are measured from. */
export const mapCenter: LatLon = places.stateHouse;

export const signposts: Record<
  SignpostId,
  { label: string; bearing: number; km: number }
> = {
  nyc: { label: "New York City", bearing: 235, km: 301 },
  providence: { label: "Providence", bearing: 206, km: 65 },
  urbana: { label: "Urbana-Champaign", bearing: 266, km: 1454 },
};

const METERS_PER_DEGREE = 111_320;

/** A point offset from `from` by some meters north and east. */
export function near(from: LatLon, north: number, east: number): LatLon {
  const cosLat = Math.cos((from.lat * Math.PI) / 180);
  return {
    lat: round(from.lat + north / METERS_PER_DEGREE),
    lon: round(from.lon + east / (METERS_PER_DEGREE * cosLat)),
  };
}

function round(degrees: number): number {
  return Math.round(degrees * 1e5) / 1e5;
}
