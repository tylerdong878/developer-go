import { wild as roster, type WildSpecies } from "@/content";
import { slots, walkable } from "./base";
import type { Vec2 } from "./geometry";

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
/** The leaves rustle this long before it pops out, and it takes this long to go. */
export const RUSTLE = 1.4;
export const LEAVE = 0.6;

let spawns: WildSpawn[] = [];
let nextId = 1;
let nextAt: number | null = null;
/** The one being caught, which never leaves mid-throw. */
let held: number | null = null;
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

function pick(rand: () => number) {
  const total = roster.reduce((n, s) => n + s.weight, 0);
  let r = rand() * total;
  for (const s of roster) if ((r -= s.weight) < 0) return s;
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
};

/**
 * Keeps wild Pokémon coming and going around the trainer, like GO: one at a
 * time, leaves rustle at a spot near him and then it pops out; old ones leave
 * (a little later if he's right there), and ones he's left behind are forgotten.
 * Call it about once a second.
 */
export function refreshWild(x: number, z: number, now: number, rand: () => number = Math.random, { ahead = null, goal = null }: Around = {}) {
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
  const out = spawns.filter((s) => s.leaving === null).length;
  if (now >= nextAt && out < COUNT) {
    const firstOne = nextId === 1;
    for (let tries = 0; tries < 40; tries++) {
      const p = spotFor(x, z, rand, ahead, firstOne);
      if (!openSpot(p) || Math.hypot(p[0] - x, p[1] - z) < NEAR) continue;
      spawns = [...spawns, { id: nextId++, species: pick(rand), x: p[0], z: p[1], born: now, until: now + lifetime(rand), leaving: null }];
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
