import { mapCenter } from "@/content/places";
import { metersPerDegree } from "@/map/projection";
import type { Box } from "./geometry";

/** Real data reaches this far from the State House; past it, the map fades to fog. */
export const WORLD_RADIUS = 30_000;
/**
 * Smaller roads only show up closer in: far out the map is squeezed so hard
 * they'd just be clutter, and downtown is where the map is near true scale.
 */
export const SECONDARY_RADIUS = 14_000;
export const TERTIARY_RADIUS = 9_000;
export const STREET_RADIUS = 3_500;

export const CACHE_DIR = ".cache/osm";
export const DATA_DIR = "src/map/data";

/** The box around the world circle. Coastlines are closed into land inside it. */
export const worldBox: Box = (() => {
  const m = metersPerDegree(mapCenter.lat);
  const dLat = WORLD_RADIUS / m.lat;
  const dLon = WORLD_RADIUS / m.lon;
  return {
    west: mapCenter.lon - dLon,
    south: mapCenter.lat - dLat,
    east: mapCenter.lon + dLon,
    north: mapCenter.lat + dLat,
  };
})();
