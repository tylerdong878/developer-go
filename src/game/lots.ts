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
/** Kanto's house kinds (notes/research/gfx-buildings.md 7.6): Pallet's twins for Tyler and his rival, Viridian's plank houses and Vermilion's tile-roofed ones for everyone else. */
export type HouseStyle = "pallet" | "viridian" | "vermilion";
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
  /** Houses only: the roof color, whether it's the mirror twin (upper floor on the other side), and which town's house. */
  roof?: string;
  flip?: boolean;
  style?: HouseStyle;
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
export function house(x: number, z: number, w: number, d: number, turn: number, rest: { color: string; roof: string; slug?: string; flip?: boolean; style?: HouseStyle }): Building {
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
    // the wall height for Pallet's houses; for the others, about the roof top (so the fade knows when one's in the way)
    h: rest.style === "vermilion" ? 7.6 : rest.style === "viridian" ? 5.6 : 3,
    color: rest.color,
    roof: rest.roof,
    flip: rest.flip,
    slug: rest.slug,
    style: rest.style ?? "pallet",
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
  /** The streets, for lining them with blocks. */
  streets?: { width: number; points: Vec2[] }[];
};

/** What lines the streets in each district, and how often (town-polish.md 7). Homes keep their houses. */
const FRONTAGE: Partial<Record<District, [Recipe, number][]>> = {
  downtown: [
    ["saffron", 0.4],
    ["glass", 0.3],
    ["stone", 0.15],
    ["brick", 0.15],
  ],
  harbor: [
    ["glass", 0.45],
    ["stone", 0.3],
    ["saffron", 0.25],
  ],
  campus: [
    ["brick", 0.85],
    ["glass", 0.15],
  ],
};
const FLOORS: Record<Recipe, [number, number]> = { saffron: [2, 4], glass: [3, 5], stone: [4, 5], brick: [3, 4] };
/** Sidewalk plus a little setback, from the road's edge to a block's front. */
const SETBACK = 2.02 + 0.4;

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

  const fits = (b: Building, gap = 1.6) => {
    if (Math.hypot(b.x, b.z) + Math.max(b.w, b.d) / 2 > site.radius - 6) return false;
    const pts = outline(b);
    if (pts.some((p) => site.nearRoad(p, 1.4))) return false;
    if (pts.some((p) => site.keepOut.some((poly) => pointInPolygon(p, poly)))) return false;
    if (site.clearings.some(({ at, r }) => distanceToBuilding(at, b) < r)) return false;
    if (site.trees.some((t) => distanceToBuilding(t, b) < 2.4)) return false;
    // Front a street: some edge midpoint sits close to a road.
    if (!pts.some((p) => site.nearRoad(p, 4.5))) return false;
    return !placed.some((o) => overlaps(o, b, gap));
  };

  // Street walls first (town-polish.md 7): downtown, the harbor and the campus edge get blocks shoulder to
  // shoulder along every street, fronts on the sidewalk, in runs of two or three that share a look. Each gym,
  // stop and raid keeps a way in: a gap 7 m wide off its nearest street that its own building isn't in the way of.
  const front = random(2016);
  const streets = site.streets ?? [];
  const ways = site.clearings.map(({ at }) => {
    let best: { street: number; seg: number; side: number; along: number } | null = null;
    let near = Infinity;
    streets.forEach((st, k) => {
      for (let i = 0; i + 1 < st.points.length; i++) {
        const a = st.points[i];
        const b = st.points[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const dir: Vec2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
        const along = (at[0] - a[0]) * dir[0] + (at[1] - a[1]) * dir[1];
        const across = (at[0] - a[0]) * -dir[1] + (at[1] - a[1]) * dir[0];
        if (along < 0 || along > len || Math.abs(across) >= near) continue;
        // the way out to the street mustn't run through a building that's already there
        const foot: Vec2 = [a[0] + dir[0] * along, a[1] + dir[1] * along];
        const clear = [0.2, 0.4, 0.6, 0.8].every((t) => {
          const p: Vec2 = [at[0] + (foot[0] - at[0]) * t, at[1] + (foot[1] - at[1]) * t];
          return !placed.some((o) => distanceToBuilding(p, o) < 1);
        });
        if (!clear) continue;
        near = Math.abs(across);
        best = { street: k, seg: i, side: Math.sign(across) || 1, along };
      }
    });
    return best as { street: number; seg: number; side: number; along: number } | null;
  });
  const choose = (mix: [Recipe, number][]) => {
    let r = front();
    for (const [k, p] of mix) if ((r -= p) < 0) return k;
    return mix[0][0];
  };
  streets.forEach((street, k) => {
    for (let i = 0; i + 1 < street.points.length; i++) {
      const a = street.points[i];
      const b = street.points[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dir: Vec2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      for (const side of [-1, 1]) {
        const n: Vec2 = [-dir[1] * side, dir[0] * side];
        const turn = Math.atan2(-n[0], -n[1]);
        const wayIn = (mid: number, w: number) => ways.some((way) => way && way.street === k && way.seg === i && way.side === side && Math.abs(way.along - mid) < w / 2 + 3.5);
        let recipe: Recipe | null = null;
        let run = 0;
        let floors = 0;
        for (let s = 0; s < len; ) {
          const w = 10 + front() * 5;
          const mid = s + w / 2;
          if (mid + w / 2 > len) break;
          const at = (off: number): Vec2 => [a[0] + dir[0] * mid + n[0] * off, a[1] + dir[1] * mid + n[1] * off];
          const mix = FRONTAGE[districtAt(at(street.width / 2 + 9))];
          if (!mix || wayIn(mid, w)) {
            s += 2;
            recipe = null;
            continue;
          }
          if (!recipe || run <= 0) {
            recipe = choose(mix);
            run = 2 + Math.floor(front() * 2);
            floors = 0;
          }
          const [lo, hi] = FLOORS[recipe];
          const want = lo + Math.floor(front() * (hi - lo + 1));
          // a street steps up or down one storey at a time
          const f = floors ? Math.min(floors + 1, Math.max(floors - 1, want)) : want;
          const lot = [10 + front() * 3, 7.5, 6]
            .map((d) => {
              const [x, z] = at(street.width / 2 + SETBACK + d / 2);
              return block(x, z, w, d, turn, recipe!, f, recipe === "brick" ? "brick" : "office");
            })
            .find((bl) => fits(bl, 0.2));
          if (lot) {
            placed.push(lot);
            s += w + 0.25;
            run--;
            floors = f;
          } else {
            s += 2;
            recipe = null;
          }
        }
      }
    }
  });
  const lined = placed.length - SIGNATURE.length;

  /** Turn the front toward the closest street (the first side that has one right outside it). */
  const toStreet = (x: number, z: number, size: number): number => {
    for (const turn of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const p: Vec2 = [x + Math.sin(turn) * (size / 2 + 3), z + Math.cos(turn) * (size / 2 + 3)];
      if (site.nearRoad(p, 1)) return turn;
    }
    return 0;
  };

  for (let i = 0; i < 9000 && placed.length < 150 + lined; i++) {
    const p: Vec2 = [(rand() * 2 - 1) * site.radius, (rand() * 2 - 1) * site.radius];
    const district = districtAt(p);
    if (district === "homes") {
      const w = 6.5 + rand() * 2.5;
      const d = 5.5 + rand() * 1.5;
      // half Viridian, half Vermilion, by where it stands (so the layout's random numbers don't shift)
      const n = Math.sin(p[0] * 12.9898 + p[1] * 78.233) * 43758.5453;
      const style: HouseStyle = n - Math.floor(n) < 0.5 ? "viridian" : "vermilion";
      const b = house(p[0], p[1], w, d, toStreet(p[0], p[1], Math.max(w, d)), { color: pick(WALLS), roof: pick(ROOFS), flip: rand() < 0.5, style });
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
