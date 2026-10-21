import { wild as roster, type WildSpecies } from "@/content";
import { slots, walkable } from "./base";
import type { Vec2 } from "./geometry";
import { boosted, NIGHT_OWLS } from "./species";
import type { Weather } from "./weather";

/**
 * A wild Pokémon on the map. `born` is when its spot started rustling (on the
 * scene clock), `until` when it wanders off, and `leaving` when it started to.
 */
export type WildSpawn = {
  id: number;
  species: WildSpecies;
  x: number;
  z: number;
  born: number;
  until: number;
  leaving: number | null;
  /** It got a few more seconds because he was right next to it. */
  lingered?: boolean;
  /** Drawn in by a lured stop: it stands in pink petals and stays out of Nearby, like GO. */
  lured?: boolean;
};

/**
 * GO only shows wild Pokémon round you, mostly inside the ring
 * (notes/research/spawns.md). Our pink ring (9) stands for GO's 80 m, so 1 GO
 * meter is about 0.11 here, and GO's 30 minutes is about 90 s.
 */
const COUNT = 7;
/** Born 3-9 out (inside the ring) most of the time, 9-16 otherwise; ahead of him in a cone when he's walking. */
const RING = 9;
const NEAR = 3;
const FAR = 16;
/** Past this they're forgotten, like walking out of GO's draw range. */
const GONE = 28;
/** GO trickles spawns in instead of filling the map at once: a new one about this often while there's room, in seconds. */
const EVERY: [number, number] = [3, 7];
/** The first one shows up this soon after the visit starts, inside the ring. */
const FIRST = 1.6;
/**
 * A lured stop (notes/research/spawns.md 6, "For us"): while he's within 20,
 * one comes every 15-20 s, 3-8 from the stop, up to 3 at a time, for a minute.
 * Four of the lured stops stand together downtown, so all the lures together
 * keep to 4 out at once.
 */
const LURE = { reach: 20, every: [15, 20] as const, near: 3, far: 8, most: 3, all: 4, life: 60 };
/** The leaves rustle this long before it pops out, and it takes this long to go. */
export const RUSTLE = 1.4;
export const LEAVE = 0.6;

let spawns: WildSpawn[] = [];
let nextId = 1;
let nextAt: number | null = null;
/** The one being caught, which never leaves mid-throw. */
let held: number | null = null;
/** When each lured stop next draws one in, by where it stands. */
const lureNext = new Map<string, number>();
/** The scene clock at the last refresh, so lists can tell which ones are out. */
let clock = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const wildStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => spawns,
};

export const goalId = (s: WildSpawn) => `wild:${s.id}`;
export const findWild = (goal: string) => spawns.find((s) => goalId(s) === goal);
/** Out on the map: done rustling and not on its way off. */
export const isOut = (s: WildSpawn, now = clock) => s.leaving === null && now - s.born >= RUSTLE;

/** How likely each species is right now: GO spawns boosted types more often, and a few species more at night. */
function weightOf(s: WildSpecies, weather: Weather | null, night: boolean) {
  return s.weight * (weather && boosted(s.dex, weather) ? 2 : 1) * (night && NIGHT_OWLS.has(s.dex) ? 2 : 1);
}

function pick(rand: () => number, weather: Weather | null, night: boolean) {
  const total = roster.reduce((n, s) => n + weightOf(s, weather, night), 0);
  let r = rand() * total;
  for (const s of roster) if ((r -= weightOf(s, weather, night)) < 0) return s;
  return roster[0];
}

/** How long one stays: GO's 30 minutes for most, 60 for about 1 in 10, at our scale. */
const lifetime = (rand: () => number) => (rand() < 0.1 ? 150 + rand() * 30 : 75 + rand() * 30);

/** Somewhere to be born, round the trainer or ahead of him. */
function spotFor(x: number, z: number, rand: () => number, ahead: number | null, first: boolean): Vec2 {
  if (ahead !== null && !first && rand() < 0.7) {
    const a = ahead + (rand() - 0.5) * 1.6;
    const d = 10 + rand() * 6;
    return [x + Math.sin(a) * d, z + Math.cos(a) * d];
  }
  const a = rand() * Math.PI * 2;
  const d = first || rand() < 0.6 ? NEAR + rand() * (RING - NEAR) : RING + rand() * (FAR - RING);
  return [x + Math.cos(a) * d, z + Math.sin(a) * d];
}

/** Clear of the gyms, stops, and other Pokémon, on dry land. */
function openSpot(p: Vec2) {
  if (!walkable(p)) return false;
  if (Object.values(slots).some(([x, z]) => Math.hypot(p[0] - x, p[1] - z) < 6)) return false;
  return spawns.every((s) => Math.hypot(p[0] - s.x, p[1] - s.z) > 7);
}

type Around = {
  /** Which way he's walking (radians, like the trainer's heading), or null standing still. */
  ahead?: number | null;
  /** The goal he's walking to, so that one doesn't leave before he gets there. */
  goal?: string | null;
  /** The weather now (boosted types come out more) and whether it's night. */
  weather?: Weather | null;
  night?: boolean;
  /** Where the lured stops stand. */
  lures?: Vec2[];
};

/**
 * Keeps wild Pokémon coming and going around the trainer, like GO: one at a
 * time, leaves rustle at a spot near him and then it pops out; old ones leave
 * (a little later if he's right there), and ones he's left behind are forgotten.
 * Call it about once a second.
 */
export function refreshWild(x: number, z: number, now: number, rand: () => number = Math.random, { ahead = null, goal = null, weather = null, night = false, lures = [] }: Around = {}) {
  clock = now;
  let changed = false;
  if (nextAt === null) nextAt = now + FIRST;
  for (const s of spawns) {
    if (s.leaving !== null || s.id === held || goalId(s) === goal) continue;
    const d = Math.hypot(s.x - x, s.z - z);
    if (d > GONE) {
      // out of range: gone without a puff, nobody's watching
      s.leaving = now - LEAVE;
      changed = true;
    } else if (s.until <= now) {
      // GO's timers don't care, but at our scale a few more seconds right next to him is kinder
      if (d < RING && !s.lingered) {
        s.until = now + 20;
        s.lingered = true;
      } else {
        s.leaving = now;
        changed = true;
      }
    }
  }
  const before = spawns.length;
  spawns = spawns.filter((s) => s.leaving === null || now - s.leaving < LEAVE);
  if (spawns.length !== before) changed = true;
  // lured stops draw their own, on top of the usual ones
  for (const at of lures) {
    const key = at.join(",");
    if (Math.hypot(at[0] - x, at[1] - z) > LURE.reach) continue;
    const due = lureNext.get(key) ?? now + 2;
    if (!lureNext.has(key)) lureNext.set(key, due);
    if (now < due) continue;
    lureNext.set(key, now + LURE.every[0] + rand() * (LURE.every[1] - LURE.every[0]));
    const lured = spawns.filter((s) => s.lured && s.leaving === null);
    const mine = lured.filter((s) => Math.hypot(s.x - at[0], s.z - at[1]) < LURE.far + 4).length;
    if (mine >= LURE.most || lured.length >= LURE.all) continue;
    for (let tries = 0; tries < 20; tries++) {
      const a = rand() * Math.PI * 2;
      const d = LURE.near + rand() * (LURE.far - LURE.near);
      const p: Vec2 = [at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d];
      if (!walkable(p) || spawns.some((s) => Math.hypot(p[0] - s.x, p[1] - s.z) < 4)) continue;
      spawns = [...spawns, { id: nextId++, species: pick(rand, weather, night), x: p[0], z: p[1], born: now, until: now + LURE.life, leaving: null, lured: true }];
      changed = true;
      break;
    }
  }
  const out = spawns.filter((s) => s.leaving === null && !s.lured).length;
  if (now >= nextAt && out < COUNT) {
    const firstOne = nextId === 1;
    for (let tries = 0; tries < 40; tries++) {
      const p = spotFor(x, z, rand, ahead, firstOne);
      if (!openSpot(p) || Math.hypot(p[0] - x, p[1] - z) < NEAR) continue;
      spawns = [...spawns, { id: nextId++, species: pick(rand, weather, night), x: p[0], z: p[1], born: now, until: now + lifetime(rand), leaving: null }];
      changed = true;
      break;
    }
    nextAt = now + EVERY[0] + rand() * (EVERY[1] - EVERY[0]);
  }
  if (changed) notify();
}

/** The one in the catch screen stays put until the catch is over (null to let go). */
export function holdWild(id: number | null) {
  held = id;
}

/** Caught (or ran off): gone from the map. */
export function removeWild(id: number) {
  spawns = spawns.filter((s) => s.id !== id);
  notify();
}

/** Back to an empty map (for tests). */
export function resetWild() {
  spawns = [];
  nextId = 1;
  nextAt = null;
  held = null;
  lureNext.clear();
  clock = 0;
}

/**
 * Moves one along as it wanders. Positions change every frame, so this
 * updates the spawn in place instead of telling listeners (lists sample
 * positions on their own schedule).
 */
export function moveWild(id: number, x: number, z: number) {
  const s = spawns.find((w) => w.id === id);
  if (s && walkable([x, z])) {
    s.x = x;
    s.z = z;
  }
}
