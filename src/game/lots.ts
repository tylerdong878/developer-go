import { pointInPolygon, random, type Vec2 } from "./geometry";

/**
 * The neighborhood's buildings: a signature one behind each job's gym, Tyler's
 * house by the roundabout, blocks downtown like Saffron, Lumiose or Paldea,
 * and Pokémon-town houses everywhere else, all built in code from our own
 * kit (scene/Blocks.tsx, scene/heroes.ts). Each faces its street or its gym.
 * Footprints stay axis-aligned boxes, so walking around them is a simple
 * rectangle test.
 */
export type BuildingKind = "tower" | "office" | "brick" | "house" | "shop" | "center" | "mart";
/** Built in code instead of loaded: houses, the Pokémon Center, and the Poké Mart. */
export type HouseModel = "house" | "center" | "mart" | "block";
/** The kit's block recipes (scene/Blocks.tsx): an LGPE Saffron block, a Paldea glass box, Lumiose stone, Back Bay brick. */
export type Recipe = "saffron" | "glass" | "stone" | "brick";


export type Building = {
  kind: BuildingKind;
  model: HouseModel;
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
  /** Houses only: the roof color, and whether it's the mirror twin (upper floor on the other side). */
  roof?: string;
  flip?: boolean;
  /** The gym this building belongs to, or "home". */
  slug?: string;
  /** Kit blocks only: which recipe, and how many storeys. */
  recipe?: Recipe;
  floors?: number;
};

/** Ground floor, upper floors and the cap, per recipe (meters), so a block's height follows from its storeys. */
const STOREY: Record<Recipe, [number, number, number]> = {
  saffron: [4.2, 3, 0.6],
  glass: [4.4, 3.2, 0.5],
  stone: [4.6, 3.2, 0.4],
  brick: [3.6, 3, 0.5],
};

/** A block from our own kit: w and d are its own width and depth (front first), floors its storeys. */
export function block(x: number, z: number, w: number, d: number, turn: number, recipe: Recipe, floors: number, kind: BuildingKind): Building {
  const sideways = Math.round(turn / (Math.PI / 2)) % 2 !== 0;
  const [g0, fl, cap] = STOREY[recipe];
  return {
    kind,
    model: "block",
    scale: 1,
    turn,
    x,
    z,
    w: sideways ? d : w,
    d: sideways ? w : d,
    h: g0 + (floors - 1) * fl + cap,
    color: "#ffffff",
    recipe,
    floors,
  };
}

/** A Pokémon-town house: w and d are its walls, h is the wall height (the roof sits on top). */
export function house(x: number, z: number, w: number, d: number, turn: number, rest: { color: string; roof: string; slug?: string; flip?: boolean }): Building {
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
    h: 3,
    color: rest.color,
    roof: rest.roof,
    flip: rest.flip,
    slug: rest.slug,
  };
}

/** A job's own building, built by its hero design (scene/heroes.ts): w and d are its own width and depth, h its height. */
export function hero(slug: string, x: number, z: number, w: number, d: number, h: number, turn: number, kind: BuildingKind): Building {
  const sideways = Math.round(turn / (Math.PI / 2)) % 2 !== 0;
  return { kind, model: "block", scale: 1, turn, x, z, w: sideways ? d : w, d: sideways ? w : d, h, color: "#ffffff", slug };
}

/**
 * The Pokémon Center and Poké Mart, as they are in Let's Go Pikachu/Eevee
 * (modeled in scene/civic/Civic.tsx): footprint and full height.
 */
export function civic(kind: "center" | "mart", x: number, z: number, turn: number, slug: string): Building {
  const [w, d, h] = kind === "center" ? [10, 9, 9.6] : [10, 6.5, 7.3];
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
  // AWS: the only tall tower in town, the skyline you see from everywhere
  hero("aws", 29, -47, 12, 11, 34.6, -Math.PI / 2, "tower"),
  hero("tetracorp", -29, -47, 11, 11, 13.8, Math.PI / 2, "office"),
  hero("philips", 29, -79, 12, 11, 21.4, -Math.PI / 2, "tower"),
  // Northeastern's Khoury: tinted brick red
  hero("khoury", -29, -75, 14, 11, 15, Math.PI / 2, "brick"),
  hero("outamation", 71, -79, 9, 9, 17.7, -Math.PI / 2, "office"),
  hero("quartzy", -74, -79, 10.5, 10.5, 14.6, Math.PI / 2, "office"),
  // a big store at the north end of the avenue
  hero("homegoods", 0, -127, 25, 11, 13, 0, "shop"),
  // the Pokémon Center and Poké Mart, either side of the avenue just north of home, like a Kanto town
  civic("center", 12, -24, 0, "center"),
  civic("mart", -12, -24, 0, "mart"),
  // Tyler's house, just south of the roundabout, facing it
  // Tyler's house and its blue twin across the avenue, like Pallet Town's player and rival houses
  house(-10, 26, 9, 7.5, Math.PI, { color: "#e0d9c4", roof: "#b24c49", slug: "home" }),
  house(10, 26, 9, 7.5, Math.PI, { color: "#e0d9c4", roof: "#2a6fa6", flip: true, slug: "rival" }),
];

/** Let's Go's Kanto towns: cream plaster under each town's roof color (Pallet red and blue, Viridian green, Vermilion orange, Lavender purple). */
const WALLS = ["#e0d9c4", "#e6dfca", "#dcd4bd"];
const ROOFS = ["#b24c49", "#2a6fa6", "#4d745d", "#e88e47", "#63547f"];

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
    if (district === "homes") {
      const w = 6.5 + rand() * 2.5;
      const d = 5.5 + rand() * 1.5;
      const b = house(p[0], p[1], w, d, toStreet(p[0], p[1], Math.max(w, d)), { color: pick(WALLS), roof: pick(ROOFS), flip: rand() < 0.5 });
      if (fits(b)) placed.push(b);
      continue;
    }
    // our own kit: toy-scale blocks, 2 to 5 storeys, the recipe mixed by district (gfx-buildings.md 7.4)
    const r = rand();
    const recipe: Recipe =
      district === "campus" ? (r < 0.8 ? "brick" : "glass") : district === "harbor" ? (r < 0.5 ? "glass" : r < 0.8 ? "stone" : "saffron") : r < 0.45 ? "saffron" : r < 0.8 ? "glass" : "stone";
    const floors = recipe === "glass" ? 3 + Math.floor(rand() * 3) : recipe === "stone" ? 4 + Math.floor(rand() * 2) : recipe === "brick" ? 3 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
    const w = 10 + rand() * 6;
    const d = 9 + rand() * 5;
    const b = block(p[0], p[1], w, d, toStreet(p[0], p[1], Math.max(w, d)), recipe, floors, recipe === "brick" ? "brick" : "office");
    if (fits(b)) placed.push(b);
  }
  return placed;
}
