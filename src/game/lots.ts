import { pointInPolygon, random, type Vec2 } from "./geometry";

/**
 * The neighborhood's buildings: a signature one behind each job's gym, Tyler's
 * house by the roundabout, and blocks of offices, campus halls, and houses
 * along the streets. Every footprint is an axis-aligned box, so walking
 * around them is a simple rectangle test.
 */
export type BuildingKind = "tower" | "office" | "brick" | "house" | "shop";
export type Building = {
  kind: BuildingKind;
  x: number;
  z: number;
  /** Size along x (w) and z (d), and the height of the walls. */
  w: number;
  d: number;
  h: number;
  color: string;
  /** The gym this building belongs to, or "home". */
  slug?: string;
};

/** The one behind each gym, and home. Hand-placed so each job gets its own look. */
export const SIGNATURE: Building[] = [
  // AWS: a tall dark-glass tower
  { kind: "tower", x: 29, z: -47, w: 12, d: 18, h: 34, color: "#2f4a6d", slug: "aws" },
  { kind: "office", x: -29, z: -47, w: 12, d: 16, h: 16, color: "#e8e2d4", slug: "tetracorp" },
  { kind: "tower", x: 29, z: -79, w: 12, d: 20, h: 24, color: "#3f78b8", slug: "philips" },
  // Northeastern's Khoury: red brick with white trim
  { kind: "brick", x: -29, z: -75, w: 14, d: 14, h: 13, color: "#b0533c", slug: "khoury" },
  { kind: "office", x: 71, z: -79, w: 9, d: 18, h: 18, color: "#d9dde3", slug: "outamation" },
  { kind: "office", x: -74, z: -79, w: 11, d: 16, h: 14, color: "#c9b79a", slug: "quartzy" },
  // a big-box store at the north end of the avenue
  { kind: "shop", x: 0, z: -127, w: 28, d: 12, h: 8, color: "#f0ebe1", slug: "homegoods" },
  // Tyler's house, just south of the roundabout
  { kind: "house", x: -10, z: 26, w: 9, d: 8, h: 4.2, color: "#f2d7a6", slug: "home" },
];

const OFFICE = ["#e8e2d4", "#d9dde3", "#c9d3df", "#e3d9c6", "#cfd8d4", "#bcc7d6"];
const GLASS = ["#3f6b9a", "#4d7fae", "#2f4a6d", "#5a8db8"];
const BRICK = ["#b0533c", "#a8473a", "#bf6a4a", "#9c4a3c"];
const HOUSE = ["#f2d7a6", "#f6c6b8", "#cfe3c2", "#c9dcef", "#efe0f2", "#f7e6b0", "#ffffff"];

export type District = "downtown" | "harbor" | "campus" | "homes";

/** What gets built where: offices downtown and by the harbor, brick by the campus quad, houses elsewhere. */
export function districtAt([x, z]: Vec2): District {
  if (z < -30) return "downtown";
  if (x > 28 && z > 34) return "campus";
  if (x > 38) return "harbor";
  return "homes";
}

export type Site = {
  radius: number;
  /** Is this spot on a road, or within `margin` of one? */
  nearRoad: (p: Vec2, margin: number) => boolean;
  /** Places nothing may be built on: water, the park, the quad, plazas, courts. */
  keepOut: Vec2[][];
  /** Spots that need room around them (map objects), with how much. */
  clearings: { at: Vec2; r: number }[];
  trees: Vec2[];
};

const overlaps = (a: Building, b: Building, gap: number) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w + gap * 2 && Math.abs(a.z - b.z) * 2 < a.d + b.d + gap * 2;

/** The footprint's corners and edge midpoints, for testing against roads and areas. */
function outline(b: Pick<Building, "x" | "z" | "w" | "d">): Vec2[] {
  const hw = b.w / 2;
  const hd = b.d / 2;
  const out: Vec2[] = [];
  for (const fx of [-1, -0.5, 0, 0.5, 1]) for (const fz of [-1, -0.5, 0, 0.5, 1]) out.push([b.x + fx * hw, b.z + fz * hd]);
  return out;
}

/** How far a point is from a footprint's edge (0 inside). */
export function distanceToBuilding([x, z]: Vec2, b: Building) {
  const dx = Math.max(0, Math.abs(x - b.x) - b.w / 2);
  const dz = Math.max(0, Math.abs(z - b.z) - b.d / 2);
  return Math.hypot(dx, dz);
}

/** Fills the streets with buildings, the same every load. */
export function placeBuildings(site: Site): Building[] {
  const rand = random(878);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
  const placed: Building[] = [...SIGNATURE];

  const fits = (b: Building) => {
    if (Math.hypot(b.x, b.z) + Math.max(b.w, b.d) / 2 > site.radius - 6) return false;
    const pts = outline(b);
    if (pts.some((p) => site.nearRoad(p, 1.4))) return false;
    if (pts.some((p) => site.keepOut.some((poly) => pointInPolygon(p, poly)))) return false;
    if (site.clearings.some(({ at, r }) => distanceToBuilding(at, b) < r)) return false;
    if (site.trees.some((t) => distanceToBuilding(t, b) < 2.4)) return false;
    // Front a street: some edge midpoint sits close to a road.
    if (!pts.some((p) => site.nearRoad(p, 4.5))) return false;
    return !placed.some((o) => overlaps(o, b, 1.6));
  };

  for (let i = 0; i < 9000 && placed.length < 150; i++) {
    const p: Vec2 = [(rand() * 2 - 1) * site.radius, (rand() * 2 - 1) * site.radius];
    const district = districtAt(p);
    let b: Building;
    if (district === "homes") {
      const s = 6.5 + rand() * 2.5;
      b = { kind: "house", x: p[0], z: p[1], w: s, d: s * (0.85 + rand() * 0.3), h: 3.6 + rand() * 1.4, color: pick(HOUSE) };
    } else if (district === "campus") {
      b = { kind: "brick", x: p[0], z: p[1], w: 9 + rand() * 6, d: 8 + rand() * 5, h: 8 + rand() * 5, color: pick(BRICK) };
    } else {
      const tall = rand() < (district === "downtown" ? 0.3 : 0.12);
      b = tall
        ? { kind: "tower", x: p[0], z: p[1], w: 8 + rand() * 4, d: 8 + rand() * 5, h: 20 + rand() * 12, color: pick(GLASS) }
        : { kind: "office", x: p[0], z: p[1], w: 8 + rand() * 6, d: 8 + rand() * 6, h: 8 + rand() * 9, color: pick(OFFICE) };
    }
    if (fits(b)) placed.push(b);
  }
  return placed;
}
