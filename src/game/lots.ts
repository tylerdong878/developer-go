import { pointInPolygon, random, type Vec2 } from "./geometry";

/**
 * The neighborhood's buildings: a signature one behind each job's gym, Tyler's
 * house by the roundabout, offices downtown like Saffron or Castelia, and
 * Pokémon-town houses everywhere else. Offices are Kenney's city kit models
 * (CC0), scaled up; houses are built in code in the style of the games (tall
 * colored roofs, cream walls). Each faces its street or its gym. Footprints stay axis-aligned boxes,
 * so walking around them is a simple rectangle test.
 */
export type BuildingKind = "tower" | "office" | "brick" | "house" | "shop" | "center" | "mart";
/** Built in code instead of loaded: houses, the Pokémon Center, and the Poké Mart. */
export type HouseModel = "house" | "center" | "mart";

/** Every model's size (x, height, z) at scale 1, measured from the files in public/models. */
export const MODELS = {
  "c-building-a": [0.884, 1.293, 0.94],
  "c-building-b": [0.97, 1.293, 0.94],
  "c-building-d": [0.84, 1.293, 0.9],
  "c-building-f": [0.84, 1.693, 1.03],
  "c-building-g": [0.97, 1.693, 0.922],
  "c-building-h": [0.884, 1.293, 1.008],
  "c-building-i": [1.24, 1.68, 1.302],
  "c-building-k": [2.084, 1.47, 0.942],
  "c-building-l": [1.37, 2.27, 1.402],
  "c-building-m": [1.24, 3.15, 1.242],
  "c-building-n": [2.32, 2.48, 1.82],
  "c-building-skyscraper-a": [1.36, 2.88, 1.36],
  "c-building-skyscraper-b": [1.36, 4.48, 1.36],
  "c-building-skyscraper-c": [1.28, 4.08, 1.388],
  "c-building-skyscraper-d": [1.28, 5.47, 1.388],
  "c-building-skyscraper-e": [1.295, 4.08, 1.242],
} as const satisfies Record<string, readonly [number, number, number]>;
export type ModelId = keyof typeof MODELS;

export type Building = {
  kind: BuildingKind;
  model: ModelId | HouseModel;
  scale: number;
  /** Which way the front door faces: 0 is +z (south), in quarter turns. */
  turn: number;
  x: number;
  z: number;
  /** Footprint along x (w) and z (d), and height, after scaling and turning. */
  w: number;
  d: number;
  h: number;
  /** A tint over the model's colors (white leaves them as they are). */
  color: string;
  /** Houses only: the roof color. */
  roof?: string;
  /** The gym this building belongs to, or "home". */
  slug?: string;
};

/** A Pokémon-town house: w and d are its walls, h is the wall height (the roof sits on top). */
export function house(x: number, z: number, w: number, d: number, turn: number, rest: { color: string; roof: string; slug?: string }): Building {
  const sideways = Math.round(turn / (Math.PI / 2)) % 2 !== 0;
  return {
    kind: "house",
    model: "house",
    scale: 1,
    turn,
    x,
    z,
    w: sideways ? d : w,
    d: sideways ? w : d,
    h: 3.4,
    color: rest.color,
    roof: rest.roof,
    slug: rest.slug,
  };
}

/** A building from a model: its footprint follows from the model's size, scale, and turn. */
export function build(
  model: ModelId,
  x: number,
  z: number,
  scale: number,
  turn: number,
  rest: { kind: BuildingKind; color?: string; slug?: string },
): Building {
  const [mw, mh, md] = MODELS[model];
  const sideways = Math.round(turn / (Math.PI / 2)) % 2 !== 0;
  return {
    model,
    scale,
    turn,
    x,
    z,
    w: (sideways ? md : mw) * scale,
    d: (sideways ? mw : md) * scale,
    h: mh * scale,
    color: rest.color ?? "#ffffff",
    kind: rest.kind,
    slug: rest.slug,
  };
}

/**
 * The Pokémon Center and Poké Mart, in the Let's Go / FireRed look: white
 * walls on a grey-blue base, red roof for the Center, blue for the Mart.
 */
export function civic(kind: "center" | "mart", x: number, z: number, turn: number, slug: string): Building {
  const [w, d, h] = kind === "center" ? [12, 8, 4.8] : [10, 7.5, 4.4];
  const sideways = Math.round(turn / (Math.PI / 2)) % 2 !== 0;
  return { kind, model: kind, scale: 1, turn, x, z, w: sideways ? d : w, d: sideways ? w : d, h, color: "#f4f1ea", slug };
}

/** Quarter turns that face a building's front toward a point. */
export function facing(x: number, z: number, [tx, tz]: Vec2) {
  const dx = tx - x;
  const dz = tz - z;
  if (Math.abs(dx) > Math.abs(dz)) return dx > 0 ? Math.PI / 2 : -Math.PI / 2;
  return dz > 0 ? 0 : Math.PI;
}

/** The one behind each gym, and home. Hand-placed so each job gets its own look; each faces its gym. */
export const SIGNATURE: Building[] = [
  // AWS: the tallest glass tower in town
  build("c-building-skyscraper-d", 29, -47, 8, -Math.PI / 2, { kind: "tower", slug: "aws" }),
  build("c-building-l", -29, -47, 8, Math.PI / 2, { kind: "office", slug: "tetracorp" }),
  build("c-building-skyscraper-b", 29, -79, 8, -Math.PI / 2, { kind: "tower", slug: "philips" }),
  // Northeastern's Khoury: tinted brick red
  build("c-building-n", -29, -75, 6, Math.PI / 2, { kind: "brick", color: "#e59a82", slug: "khoury" }),
  build("c-building-m", 71, -79, 7, -Math.PI / 2, { kind: "office", slug: "outamation" }),
  build("c-building-i", -74, -79, 8, Math.PI / 2, { kind: "office", color: "#f3e9d8", slug: "quartzy" }),
  // a big store at the north end of the avenue
  build("c-building-k", 0, -127, 12, 0, { kind: "shop", slug: "homegoods" }),
  // the Pokémon Center and Poké Mart, either side of the avenue just north of home, like a Kanto town
  civic("center", 12, -24, 0, "center"),
  civic("mart", -12, -24, 0, "mart"),
  // Tyler's house, just south of the roundabout, facing it
  house(-10, 26, 9, 7.5, Math.PI, { color: "#fff6e6", roof: "#d8483c", slug: "home" }),
];

const OFFICES: ModelId[] = ["c-building-a", "c-building-b", "c-building-d", "c-building-f", "c-building-g", "c-building-h", "c-building-i", "c-building-l", "c-building-m"];
const TOWERS: ModelId[] = ["c-building-skyscraper-a", "c-building-skyscraper-c", "c-building-skyscraper-e", "c-building-skyscraper-b"];
const CAMPUS: ModelId[] = ["c-building-i", "c-building-l", "c-building-n", "c-building-k"];
const OFFICE_TINT = ["#ffffff", "#f6f3ee", "#eef3f8", "#f4efe6"];
const BRICK = ["#e59a82", "#e3a58c", "#d98f78"];
/** Wall and roof colors from the games' towns: cream and white walls under red, blue, green, and orange roofs. */
const WALLS = ["#fff6e6", "#ffffff", "#f6efe2", "#fdf3dc", "#eef2f5"];
const ROOFS = ["#d8483c", "#3d6fc4", "#4aa35a", "#e0863a", "#8a5ac8", "#2f9bb0"];

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

  /** Turn the front toward the closest street (the first side that has one right outside it). */
  const toStreet = (x: number, z: number, size: number): number => {
    for (const turn of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const p: Vec2 = [x + Math.sin(turn) * (size / 2 + 3), z + Math.cos(turn) * (size / 2 + 3)];
      if (site.nearRoad(p, 1)) return turn;
    }
    return 0;
  };

  for (let i = 0; i < 9000 && placed.length < 150; i++) {
    const p: Vec2 = [(rand() * 2 - 1) * site.radius, (rand() * 2 - 1) * site.radius];
    const district = districtAt(p);
    let model: ModelId;
    let scale: number;
    let kind: BuildingKind;
    let color: string;
    if (district === "homes") {
      const w = 6.5 + rand() * 2.5;
      const d = 5.5 + rand() * 1.5;
      const b = house(p[0], p[1], w, d, toStreet(p[0], p[1], Math.max(w, d)), { color: pick(WALLS), roof: pick(ROOFS) });
      if (fits(b)) placed.push(b);
      continue;
    } else if (district === "campus") {
      [model, scale, kind, color] = [pick(CAMPUS), 6 + rand() * 1.5, "brick", pick(BRICK)];
    } else if (rand() < (district === "downtown" ? 0.3 : 0.12)) {
      [model, scale, kind, color] = [pick(TOWERS), 6.5 + rand() * 1.5, "tower", "#ffffff"];
    } else {
      [model, scale, kind, color] = [pick(OFFICES), 7 + rand() * 2, "office", pick(OFFICE_TINT)];
    }
    const size = Math.max(MODELS[model][0], MODELS[model][2]) * scale;
    const b = build(model, p[0], p[1], scale, toStreet(p[0], p[1], size), { kind, color });
    if (fits(b)) placed.push(b);
  }
  return placed;
}
