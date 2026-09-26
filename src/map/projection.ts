import { mapCenter } from "@/content/places";
import type { LatLon } from "@/content/types";

/** A point in map units: meters at the center, x east, y south (SVG style). */
export type Point = { x: number; y: number };

/**
 * How hard the map squeezes distance. Within about this radius the map is
 * close to true scale; past it, distance grows logarithmically, which pulls
 * the suburbs in so Westwood and Babson fit at the edge.
 */
export const SQUASH_RADIUS = 4000;

const EARTH_RADIUS = 6_371_000;
const RAD = Math.PI / 180;

/** Meters per degree of latitude and longitude at a given latitude. */
export function metersPerDegree(lat: number) {
  const phi = lat * RAD;
  return {
    lat: 111_132.954 - 559.822 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi),
    lon:
      111_412.84 * Math.cos(phi) -
      93.5 * Math.cos(3 * phi) +
      0.118 * Math.cos(5 * phi),
  };
}

const scale = metersPerDegree(mapCenter.lat);

export function squash(r: number): number {
  return SQUASH_RADIUS * Math.asinh(r / SQUASH_RADIUS);
}

export function unsquash(r: number): number {
  return SQUASH_RADIUS * Math.sinh(r / SQUASH_RADIUS);
}

/**
 * Real-world position to map position. Keeps every bearing from the center
 * exact and squeezes only the distance.
 */
export function project(p: LatLon): Point {
  const east = (p.lon - mapCenter.lon) * scale.lon;
  const north = (p.lat - mapCenter.lat) * scale.lat;
  const r = Math.hypot(east, north);
  if (r === 0) return { x: 0, y: 0 };
  const k = squash(r) / r;
  return { x: east * k, y: -north * k };
}

export function unproject({ x, y }: Point): LatLon {
  const r = Math.hypot(x, y);
  const k = r === 0 ? 1 : unsquash(r) / r;
  return {
    lat: mapCenter.lat + (-y * k) / scale.lat,
    lon: mapCenter.lon + (x * k) / scale.lon,
  };
}

/** Real distance in meters (haversine). Used for km walked, never map units. */
export function distanceMeters(a: LatLon, b: LatLon): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}
