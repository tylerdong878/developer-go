import { spawns as facts, wild as roster } from "@/content";
import { areas, landmarks, LAB, slots, walkable } from "./base";
import { pointInPolygon, random, type Vec2 } from "./geometry";
import { halloweenPart, spotlightNow } from "./events";
import { boosted, NIGHT_OWLS } from "./species";
import type { Weather } from "./weather";

/*
 * GO's spawn system at our scale (notes/research/spawn-points.md). Pokémon
 * appear at fixed spawn points, the same for every visitor. Each point fires
 * at its own minute of every hour, and what comes out is rolled from the point
 * and the hour, so two people looking at the same spot at the same moment see
 * the same Pokémon. What comes out depends on where the point is (its habitat:
 * water types by water, bugs and grass types in the park, Meowth and Magnemite
 * downtown), the weather, the time of day, and the park's nest. Our pink ring
 * (9) stands for GO's 80 m, and time runs 20x: GO's hour is our 3 minutes.
 */

export type Habitat = "park" | "water" | "city" | "field" | "harbor" | "rock";

export type SpawnPoint = {
  id: number;
  x: number;
  z: number;
  habitat: Habitat;
  /** Seconds into each cycle it fires, like GO's "same minute every hour". */
  offset: number;
  /** GO's 60-minute kind: out the whole cycle, a new one each fire. The rest are the 30-minute kind. */
  long: boolean;
  /** Part of a nest: a third of what comes out is the nest's species. */
  nest?: "park" | "quad";
};

/** GO's hour, and its 30 minutes, at our 20x. */
export const CYCLE = 180;
export const SHORT = 90;

/** A small deterministic hash of a few numbers, for seeding rolls that every visitor shares. */
export function hash(...parts: number[]) {
  let h = 2166136261;
  for (const p of parts) {
    h = Math.imul(h ^ (p | 0), 16777619);
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

/* ---------------- where the points are ---------------- */

const inArea = (p: Vec2, kind: string) => areas.some((a) => a.kind === kind && pointInPolygon(p, a.points));
/** How far a spot is from the edge of any water. */
function waterEdge(p: Vec2) {
  let best = Infinity;
  for (const a of areas) {
    if (a.kind !== "water" && a.kind !== "deck") continue;
    const pts = a.points;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[(i + 1) % pts.length];
      const dx = bx - ax;
      const dz = bz - az;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / (dx * dx + dz * dz || 1)));
      best = Math.min(best, Math.hypot(p[0] - (ax + t * dx), p[1] - (az + t * dz)));
    }
  }
  return best;
}

const YARD: Vec2 = [72, -108];
const rock = landmarks.find((l) => l.kind === "rock");
const ROCK: Vec2 = rock && "at" in rock ? rock.at : [-10, 98];
const courts = landmarks.filter((l) => l.kind !== "pier" && l.kind !== "rock").map((l) => ("at" in l ? l.at : [0, 0])) as Vec2[];

/** What a spot's habitat is, from what it's in or next to, like GO's biomes from map data. */
export function habitatOf(p: Vec2): Habitat {
  if (waterEdge(p) < 5 || inArea(p, "deck")) return "water";
  if (Math.hypot(p[0] - ROCK[0], p[1] - ROCK[1]) < 12 || Math.hypot(p[0] - LAB.at[0], p[1] - LAB.at[1]) < 20) return "rock";
  if (Math.hypot(p[0] - YARD[0], p[1] - YARD[1]) < 26) return "harbor";
  if (inArea(p, "park") || inArea(p, "grass")) return "park";
  if (inArea(p, "lawn") || courts.some((c) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 16)) return "field";
  return "city";
}

/** The park's nest sits on its open ground, the quad's on the campus lawn. */
const PARK_NEST: Vec2 = [-118, 2];
const QUAD_NEST: Vec2 = [58, 67];

/**
 * About 250 spawn points, laid once from the map with a fixed seed: thicker
 * in the park and by water, thinner on the streets, never on a road's
 * middle, a building, a gym or a stop.
 */
export function buildPoints(seed = 2016): SpawnPoint[] {
  const rand = random(seed);
  const out: SpawnPoint[] = [];
  const STEP = 8;
  for (let gx = -170; gx <= 170; gx += STEP)
    for (let gz = -170; gz <= 170; gz += STEP) {
      const p: Vec2 = [gx + (rand() - 0.5) * STEP * 0.8, gz + (rand() - 0.5) * STEP * 0.8];
      const keep = rand();
      if (Math.hypot(p[0], p[1]) > 158 || !walkable(p)) continue;
      if (Object.values(slots).some(([x, z]) => Math.hypot(p[0] - x, p[1] - z) < 6)) continue;
      const habitat = habitatOf(p);
      // GO's spawn points cluster in parks and by water, and run thinner along streets
      if (habitat === "city" && keep > 0.4) continue;
      if (out.some((q) => Math.hypot(q.x - p[0], q.z - p[1]) < 5)) continue;
      const nest =
        habitat === "park" && Math.hypot(p[0] - PARK_NEST[0], p[1] - PARK_NEST[1]) < 26
          ? "park"
          : habitat === "field" && Math.hypot(p[0] - QUAD_NEST[0], p[1] - QUAD_NEST[1]) < 24
            ? "quad"
            : undefined;
      out.push({ id: out.length, x: p[0], z: p[1], habitat, offset: Math.floor(rand() * CYCLE), long: rand() < 0.15, ...(nest ? { nest } : {}) });
    }
  return out;
}

/* ---------------- what comes out ---------------- */

/**
 * Base weights: GO's 2016 spawn rates, square-rooted so the order holds but a
 * short visit can still meet a rare one (Pidgey is 36x Porygon instead of
 * GO's 1,300x).
 */
export const BASE: Record<number, number> = {
  16: 40, 19: 36, 13: 27, 41: 26, 129: 22, 10: 17, 133: 17, 54: 16, 60: 15, 74: 11, 43: 10, 56: 10, 58: 10,
  52: 9, 92: 9, 81: 8, 1: 8, 100: 8, 7: 8, 66: 7, 63: 6, 39: 6, 147: 5, 4: 5, 25: 5, 255: 5, 95: 3, 106: 1.4,
  143: 1.3, 137: 1.1,
};

/** Everywhere but the water. */
const EVERYWHERE = [16, 19, 13, 41];
/** Each habitat's own species, at twice their base weight. */
const OWN: Record<Habitat, number[]> = {
  park: [10, 13, 43, 1, 25, 39, 133, 63, 143],
  water: [129, 54, 60, 7, 147],
  city: [52, 66, 92, 58, 63, 100, 81, 133, 137, 255],
  field: [133, 39, 56, 66, 58, 4, 255, 106, 143],
  harbor: [81, 100, 25, 66, 129, 54],
  rock: [74, 95, 66, 56],
};
/** GO's nesting species for each nest: the park nests a fact species, the quad one of the rest. */
const NESTERS = { park: [133, 255, 100, 81, 95], quad: [1, 4, 7, 25, 54, 58, 63, 66, 43, 60, 92] } as const;
/** Ditto hides as one of these, like GO's. */
const DITTO_AS = new Set([16, 19, 41, 129]);
const DITTO_ODDS = 1 / 20;
/** Nests move every two weeks, on a Thursday, like GO's. */
const NEST_EPOCH = Date.UTC(2026, 0, 1);
const TWO_WEEKS = 14 * 86400_000;

export type Env = { weather: Weather | null; night: boolean; at: number };

export const migration = (at: number) => Math.floor((at - NEST_EPOCH) / TWO_WEEKS);

/** This fortnight's nest species. The park's and the quad's never match. */
export function nestSpecies(nest: "park" | "quad", at: number) {
  const list = NESTERS[nest];
  return list[hash(nest === "park" ? 1 : 2, migration(at)) % list.length];
}

/** The species a point can roll and how likely each is right now. */
export function tableFor(habitat: Habitat, env: Env): [number, number][] {
  const out = new Map<number, number>();
  const add = (dex: number, k: number) => out.set(dex, (out.get(dex) ?? 0) + (BASE[dex] ?? 1) * k);
  if (habitat !== "water") EVERYWHERE.forEach((d) => add(d, 1));
  else [16, 41].forEach((d) => add(d, 1));
  OWN[habitat].forEach((d) => add(d, 2));
  // GO's Halloween: Zubat out everywhere in Part I, Gastly on every kind of ground, and more of it in Part II
  const spooky = halloweenPart(env.at);
  if (spooky) {
    add(41, spooky === 1 ? 4 : 1);
    add(92, spooky === 1 ? 2 : 4);
  }
  // GO's Spotlight Hour: the featured one everywhere (not on the water, unless it swims)
  const lit = spotlightNow(env.at);
  if (lit && (habitat !== "water" || lit === 129 || lit === 54 || lit === 60)) add(lit, 40);
  // weather boosts and the night owls, like GO's
  for (const [d, w] of out) out.set(d, w * (env.weather && boosted(d, env.weather) ? 2 : 1) * (env.night && NIGHT_OWLS.has(d) ? 2 : 1));
  return [...out];
}

const NAMES = new Map<number, string>([...roster.map((w) => [w.dex, w.name] as const), ...facts.map((f) => [f.pokemon.dex, f.pokemon.name] as const)]);
export const nameOf = (dex: number) => NAMES.get(dex) ?? `#${dex}`;

/** One appearance at a point: shared by everyone who looks. */
export type Appearance = {
  key: string;
  point: SpawnPoint;
  /** What it really is (Ditto under a disguise), and what it looks like until caught. */
  dex: number;
  looks: number;
  x: number;
  z: number;
  /** When it came out and when it goes, in epoch ms. */
  from: number;
  until: number;
};

/** What's on a point at a moment, or null if it's resting. Pure: every visitor gets the same answer. */
export function appearanceAt(point: SpawnPoint, at: number, env: Env): Appearance | null {
  const t = at / 1000 - point.offset;
  const cycle = Math.floor(t / CYCLE);
  const into = t - cycle * CYCLE;
  const life = point.long ? CYCLE : SHORT;
  if (into >= life) return null;
  const rand = random(hash(point.id, cycle));
  let dex: number;
  if (point.nest && rand() < 0.35) dex = nestSpecies(point.nest, at);
  else {
    const table = tableFor(point.habitat, env);
    let r = rand() * table.reduce((n, [, w]) => n + w, 0);
    dex = table[0][0];
    for (const [d, w] of table) if ((r -= w) < 0) {
      dex = d;
      break;
    }
  }
  const ditto = DITTO_AS.has(dex) && rand() < DITTO_ODDS;
  // a little nudge off the point each time, like GO's
  const a = rand() * Math.PI * 2;
  const r = rand();
  let x = point.x + Math.cos(a) * r;
  let z = point.z + Math.sin(a) * r;
  if (!walkable([x, z])) [x, z] = [point.x, point.z];
  const from = (point.offset + cycle * CYCLE) * 1000;
  return { key: `${point.id}:${cycle}`, point, dex: ditto ? 132 : dex, looks: dex, x, z, from, until: from + life * 1000 };
}

/** The points, filed in a grid so finding the ones near the trainer is quick. */
export class PointGrid {
  readonly points: SpawnPoint[];
  private cells = new Map<string, SpawnPoint[]>();
  private static CELL = 24;
  constructor(points: SpawnPoint[]) {
    this.points = points;
    for (const p of points) {
      const key = `${Math.floor(p.x / PointGrid.CELL)},${Math.floor(p.z / PointGrid.CELL)}`;
      const list = this.cells.get(key);
      if (list) list.push(p);
      else this.cells.set(key, [p]);
    }
  }
  near(x: number, z: number, radius: number) {
    const C = PointGrid.CELL;
    const out: SpawnPoint[] = [];
    for (let cx = Math.floor((x - radius) / C); cx <= Math.floor((x + radius) / C); cx++)
      for (let cz = Math.floor((z - radius) / C); cz <= Math.floor((z + radius) / C); cz++)
        for (const p of this.cells.get(`${cx},${cz}`) ?? []) if (Math.hypot(p.x - x, p.z - z) <= radius) out.push(p);
    return out;
  }
}
