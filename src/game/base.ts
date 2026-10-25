import { blob, circle, ellipse, pointInPolygon, random, rect, type Vec2 } from "./geometry";
import { distanceToBuilding, placeBuildings } from "./lots";

/**
 * Tyler's home base: a small, hand-designed GO neighborhood with some Boston
 * in it. Everything is a few seconds' walk from home.
 *
 *              HomeGoods
 *    Quartzy  [downtown gyms]  Outamation
 *        Khoury  |  Philips
 *    Tetracorp   |  AWS
 *  PARK ---------+---------     FINANCIAL PLAZA   HARBOR
 *  pond, grass (home)           quant stops       pier, Bluffs
 *  soccer  hoops  tennis        campus quad (raids)
 *              climbing rock
 *
 * Units are meters at GO's scale, where the trainer is about 2 tall and a
 * street is about 5 wide. x is east, z is south.
 */

export type RoadKind = "avenue" | "street" | "path" | "boardwalk";
export type Road = { kind: RoadKind; width: number; points: Vec2[]; loop?: boolean };

export type AreaKind = "park" | "grass" | "water" | "plaza" | "lawn" | "deck";
export type Area = { kind: AreaKind; points: Vec2[] };

export type Landmark =
  | { kind: "soccer"; at: Vec2 }
  | { kind: "tennis"; at: Vec2 }
  | { kind: "hoops"; at: Vec2 }
  | { kind: "rock"; at: Vec2 }
  | { kind: "pier"; from: Vec2; to: Vec2 };

/** Where the playable area ends. Past it the ground runs on into the fog. */
export const RADIUS = 165;

/** Where the trainer starts: home, facing downtown. */
export const START: Vec2 = [0, 6];

const pond = blob(-97, -3, 20, 0.18, 7, 32).map(([x, z]) => [x, -3 + (z + 3) * 0.7] as const);
const harbor: Vec2[] = [
  [84, -400],
  [84, -120],
  [88, -80],
  [83, -40],
  [88, -12],
  [88, 12],
  [84, 40],
  [90, 80],
  [85, 120],
  [85, 400],
  [400, 400],
  [400, -400],
];
/** The pier: a boardwalk out over the harbor to a deck at the end. */
const pierDeck = rect(106, 0, 12, 12);
const pierWalk = rect(89.5, 0, 21, 6);

const park: Vec2[] = [
  [-42, -40],
  [-80, -52],
  [-126, -50],
  [-152, -24],
  [-156, 14],
  [-136, 30],
  [-90, 29],
  [-50, 28],
  [-42, 14],
  [-40, -16],
];

export const areas: Area[] = [
  { kind: "park", points: park },
  { kind: "grass", points: blob(-62, -28, 9, 0.25, 11) },
  { kind: "grass", points: blob(-132, -22, 10, 0.25, 12) },
  { kind: "grass", points: blob(-126, 16, 9, 0.25, 13) },
  { kind: "grass", points: blob(-72, 19, 9, 0.25, 14) },
  { kind: "grass", points: blob(-108, -40, 8, 0.25, 15) },
  { kind: "lawn", points: rect(58, 67, 50, 40) },
  { kind: "lawn", points: circle(0, 0, 10, 72) },
  { kind: "plaza", points: rect(60, 0, 26, 26) },
  { kind: "water", points: pond },
  { kind: "water", points: harbor },
  { kind: "deck", points: pierDeck },
];

const ring = circle(0, 0, 16, 96);

export const roads: Road[] = [
  // the roundabout around home, and the four ways out of it
  { kind: "avenue", width: 5.5, points: ring, loop: true },
  { kind: "avenue", width: 6, points: [[0, -16], [0, -104]] },
  { kind: "avenue", width: 5.5, points: [[16, 0], [47, 0]] },
  { kind: "avenue", width: 5.5, points: [[73, 0], [80, 0]] },
  { kind: "street", width: 5, points: [[-16, 0], [-42, 0]] },
  { kind: "avenue", width: 5.5, points: [[0, 16], [0, 110]] },
  // downtown grid
  { kind: "street", width: 5, points: [[-42, -32], [79, -32]] },
  { kind: "street", width: 4.5, points: [[-84, -62], [79, -62]] },
  { kind: "street", width: 4.5, points: [[-84, -95], [79, -95]] },
  { kind: "street", width: 4.5, points: [[-40, -32], [-40, -95]] },
  { kind: "street", width: 4.5, points: [[40, -32], [40, -95]] },
  // the south side
  { kind: "street", width: 5, points: [[-84, 34], [79, 34]] },
  { kind: "street", width: 4.5, points: [[33, 34], [33, 100], [79, 100]] },
  // park paths: in from the west street, then around the pond
  { kind: "path", width: 2.6, points: [[-42, 0], [-61, -1]] },
  { kind: "path", width: 2.6, points: ellipse(-95, -2, 34, 24, 72), loop: true },
  { kind: "path", width: 2.6, points: [[-95, 22], [-92, 34]] },
  { kind: "path", width: 2.6, points: [[-95, -26], [-99, -51]] },
  // campus quad paths, corner to corner
  { kind: "path", width: 2.6, points: [[33, 47], [83, 87]] },
  { kind: "path", width: 2.6, points: [[83, 47], [33, 87]] },
  // the harbor walk and the pier
  { kind: "boardwalk", width: 4, points: [[79, -140], [79, 140]] },
  { kind: "boardwalk", width: 6, points: [[79, 0], [100, 0]] },
];

export const landmarks: Landmark[] = [
  { kind: "soccer", at: [-54, 62] },
  { kind: "hoops", at: [-16, 62] },
  { kind: "tennis", at: [4, 64] },
  { kind: "rock", at: [-10, 98] },
  { kind: "pier", from: [79, 0], to: [100, 0] },
];

/**
 * Every road segment, filed in a grid of cells by the cells it passes near,
 * so a "how close is the nearest road" test only looks at the few segments
 * around a spot. Placing the trees, flowers and buildings asks this thousands
 * of times while the page loads (notes/research/perf.md: it was 2.4 s).
 */
type Segment = { ax: number; az: number; dx: number; dz: number; len2: number; half: number };
const CELL = 12;
/** The widest a margin gets plus the widest road's half, so a query never needs more than the cells next door. */
const REACH = 6 + Math.max(...roads.map((r) => r.width / 2));
const grid = new Map<string, Segment[]>();
const cellOf = (v: number) => Math.floor(v / CELL);
for (const r of roads) {
  const n = r.loop ? r.points.length : r.points.length - 1;
  for (let i = 0; i < n; i++) {
    const a = r.points[i];
    const b = r.points[(i + 1) % r.points.length];
    const seg: Segment = { ax: a[0], az: a[1], dx: b[0] - a[0], dz: b[1] - a[1], len2: (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2, half: r.width / 2 };
    for (let cx = cellOf(Math.min(a[0], b[0]) - REACH); cx <= cellOf(Math.max(a[0], b[0]) + REACH); cx++)
      for (let cz = cellOf(Math.min(a[1], b[1]) - REACH); cz <= cellOf(Math.max(a[1], b[1]) + REACH); cz++) {
        const key = `${cx},${cz}`;
        const list = grid.get(key);
        if (list) list.push(seg);
        else grid.set(key, [seg]);
      }
  }
}

/**
 * A spot for every gym, stop, raid, Pokémon, and egg, keyed by slug.
 * Featured things sit close to home or on the way to the harbor.
 */
export const slots: Record<string, Vec2> = {
  // gyms (jobs): downtown, closest first
  aws: [16, -46],
  tetracorp: [-16, -46],
  philips: [16, -79],
  khoury: [-16, -79],
  outamation: [62, -79],
  quartzy: [-62, -79],
  homegoods: [0, -113],

  // stops (projects): the quant four around the financial plaza, Bluffs out on the pier
  "etf-pipeline": [52, -8],
  "ofi-regime-study": [68, -8],
  "matching-engine": [52, 8],
  "imc-prosperity-4": [68, 8],
  bluffs: [107, 0],
  "finance-scripts": [60, -24],
  "marine-radar-scanner": [73, -42],
  "polar-glide": [73, 44],
  "nba-analyzer": [-16, 47],
  "snake-and-pacman": [-22, -18],
  // this site, by home
  "developer-go": [20, 8],
  "spotify-playlist-updater": [-58, -12],
  snakerl: [-88, -31],
  "sentiment-aura": [-134, 0],
  "pathfinding-visualizer": [-121, 24],

  // raids (hackathons): the featured two (the wins) by home, the rest around the campus quad
  "bostonhacks-2024": [24, 22],
  "civic-tech-2025": [-24, 22],
  "hackbeanpot-2025": [46, 67],
  "hackharvard-2025": [70, 67],
  "hackillinois-2025": [58, 53],
  "sthacks-2025": [58, 81],
  "hack-at-brown-2025": [44, 110],
  "babson-buildathon-2026": [22, 110],

  // wild Pokémon (fun facts): Snorlax naps across the road to the park

  // eggs (in progress): incubating at home
  aerobloom: [-4.5, -4],
  "fall-2026": [4.5, -4],
};

/** Trees: the park, the quad, and a row down each side of the main street. */
export const trees: Vec2[] = (() => {
  const out: Vec2[] = [];
  const rand = random(2026);
  const clear = (p: Vec2, gap: number) =>
    !areas.some((a) => (a.kind === "water" || a.kind === "grass") && pointInPolygon(p, a.points)) &&
    !Object.values(slots).some(([x, z]) => Math.hypot(p[0] - x, p[1] - z) < gap) &&
    clearOfRoads(p, 3.2);
  for (let i = 0; out.length < 48 && i < 4000; i++) {
    const p: Vec2 = [-156 + rand() * 116, -52 + rand() * 82];
    if (pointInPolygon(p, park) && clear(p, 7) && out.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 7.5)) {
      out.push(p);
    }
  }
  for (let z = -40; z >= -100; z -= 18) {
    for (const x of [-9.5, 9.5]) if (clear([x, z], 4)) out.push([x, z]);
  }
  for (const x of [38, 50, 66, 78]) {
    for (const z of [50, 84]) if (clear([x, z], 5)) out.push([x, z]);
  }
  for (const p of [[37, 60], [37, 74], [79, 60], [79, 74]] as Vec2[]) {
    if (clear(p, 5)) out.push(p);
  }
  return out;
})();

/**
 * Northeastern's lab: an anime Oak's lab with its wind turbine, on a hill
 * past the campus (scene/Lab.tsx). The trainer can't climb the hill; the
 * gate at the bottom is where you go in.
 */
export const LAB = { at: [64, 127] as Vec2, scale: 0.9, hill: 12, gate: [64, 109.9] as Vec2 };

/** Courts, fields, the lab and the container yard by the Seaport's crane (scene/Harbor.tsx), with a little room around them, so nothing gets built on them. */
const landmarkLots: Vec2[][] = [rect(-54, 62, 48, 32), rect(-16, 62, 18, 17), rect(4, 64, 18, 33), rect(-10, 98, 14, 14), rect(LAB.at[0], LAB.at[1] - 3, 26, 32), rect(72, -108, 26, 18)];

/** The neighborhood's buildings, placed once from the layout above (see lots.ts). */
export const buildings = placeBuildings({
  radius: RADIUS,
  nearRoad: (p, margin) => !clearOfRoads(p, margin),
  keepOut: [...areas.map((a) => a.points), pierWalk, ...landmarkLots],
  clearings: [
    { at: START, r: 6 },
    ...Object.values(slots).map((at) => ({ at, r: 6.5 })),
  ],
  trees,
  streets: roads.filter((r) => (r.kind === "avenue" || r.kind === "street") && !r.loop),
});

/**
 * Places you can walk into that aren't map objects: the Pokémon Center and
 * the Poké Mart, by their front doors. Goals for these are "place:<slug>".
 */
export const places: Record<string, Vec2> = {
  ...Object.fromEntries(
    buildings
      .filter((b) => b.kind === "center" || b.kind === "mart")
      .map((b) => [`place:${b.slug}`, [b.x + Math.sin(b.turn) * (b.d / 2 + 2), b.z + Math.cos(b.turn) * (b.d / 2 + 2)] as Vec2]),
  ),
  // just outside the lab's gate
  "place:lab": [LAB.gate[0], LAB.gate[1] - 2.6],
};

/** Is this spot at least `margin` from every road's edge? */
export function clearOfRoads(p: Vec2, margin: number) {
  const near = grid.get(`${cellOf(p[0])},${cellOf(p[1])}`);
  if (!near) return true;
  if (margin > 6) return clearOfRoadsSlow(p, margin);
  for (const s of near) {
    const t = s.len2 ? Math.max(0, Math.min(1, ((p[0] - s.ax) * s.dx + (p[1] - s.az) * s.dz) / s.len2)) : 0;
    const ex = p[0] - (s.ax + t * s.dx);
    const ez = p[1] - (s.az + t * s.dz);
    const d = s.half + margin;
    if (ex * ex + ez * ez < d * d) return false;
  }
  return true;
}

/** The plain way, for a margin wider than the grid was built for. */
function clearOfRoadsSlow(p: Vec2, margin: number) {
  for (const segs of grid.values())
    for (const s of segs) {
      const t = s.len2 ? Math.max(0, Math.min(1, ((p[0] - s.ax) * s.dx + (p[1] - s.az) * s.dz) / s.len2)) : 0;
      const d = s.half + margin;
      if ((p[0] - (s.ax + t * s.dx)) ** 2 + (p[1] - (s.az + t * s.dz)) ** 2 < d * d) return false;
    }
  return true;
}

/** Inside the base and not in the water (the pier is fine). */
export function onLand(p: Vec2) {
  if (Math.hypot(p[0], p[1]) > RADIUS) return false;
  if (pointInPolygon(p, pierWalk) || pointInPolygon(p, pierDeck)) return true;
  return !areas.some((a) => a.kind === "water" && pointInPolygon(p, a.points));
}

/** Things you have to walk around, like the Snorlax asleep across the road to the park. */
export const blockers: { at: Vec2; r: number }[] = [
  // the fountain in the middle of the roundabout
  { at: [0, 0], r: 3.2 },
  // the lab's hill, and its gate
  { at: LAB.at, r: LAB.hill * LAB.scale + 0.3 },
  { at: [LAB.gate[0], LAB.gate[1] + 1.2], r: 2.6 },
];

/** Can the trainer stand here? Not in the water, on Snorlax, or inside a building. */
export function walkable(p: Vec2) {
  return (
    onLand(p) &&
    !blockers.some(({ at, r }) => Math.hypot(p[0] - at[0], p[1] - at[1]) < r) &&
    !buildings.some((b) => distanceToBuilding(p, b) < 0.5)
  );
}
