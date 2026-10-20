import { wild as roster, type WildSpecies } from "@/content";
import { slots, walkable } from "./base";
import type { Vec2 } from "./geometry";

/**
 * A wild Pokémon on the map. `born` is when its spot started rustling (on the
 * scene clock), `until` when it wanders off, and `leaving` when it started to.
 */
export type WildSpawn = { id: number; species: WildSpecies; x: number; z: number; born: number; until: number; leaving: number | null };

/** The most out at once, and how close to the trainer they show up. */
const COUNT = 7;
const NEAR = 10;
const FAR = 34;
/** Past this they despawn, like walking out of range in GO. */
const GONE = 70;
/** GO trickles spawns in instead of filling the map at once: a new one about this often while there's room, in seconds. */
const EVERY: [number, number] = [3, 7];
/** The leaves rustle this long before it pops out, and it takes this long to go. */
export const RUSTLE = 1.4;
export const LEAVE = 0.6;

let spawns: WildSpawn[] = [];
let nextId = 1;
let nextAt = 0;
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

/** Clear of the gyms, stops, and other Pokémon, on dry land. */
function openSpot(p: Vec2) {
  if (!walkable(p)) return false;
  if (Object.values(slots).some(([x, z]) => Math.hypot(p[0] - x, p[1] - z) < 6)) return false;
  return spawns.every((s) => Math.hypot(p[0] - s.x, p[1] - s.z) > 7);
}

/**
 * Keeps wild Pokémon coming and going around the trainer, like GO: one at a
 * time, leaves rustle at a spot a short walk away and then it pops out; old or
 * far-off ones leave. Call it about once a second.
 */
export function refreshWild(x: number, z: number, now: number, rand: () => number = Math.random) {
  clock = now;
  let changed = false;
  for (const s of spawns)
    if (s.leaving === null && (s.until <= now || Math.hypot(s.x - x, s.z - z) > GONE)) {
      s.leaving = now;
      changed = true;
    }
  const before = spawns.length;
  spawns = spawns.filter((s) => s.leaving === null || now - s.leaving < LEAVE);
  if (spawns.length !== before) changed = true;
  const out = spawns.filter((s) => s.leaving === null).length;
  if (now >= nextAt && out < COUNT) {
    for (let tries = 0; tries < 40; tries++) {
      const a = rand() * Math.PI * 2;
      const d = NEAR + rand() * (FAR - NEAR);
      const p: Vec2 = [x + Math.cos(a) * d, z + Math.sin(a) * d];
      if (!openSpot(p)) continue;
      spawns = [...spawns, { id: nextId++, species: pick(rand), x: p[0], z: p[1], born: now, until: now + 60 + rand() * 60, leaving: null }];
      changed = true;
      break;
    }
    nextAt = now + EVERY[0] + rand() * (EVERY[1] - EVERY[0]);
  }
  if (changed) notify();
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
  nextAt = 0;
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
