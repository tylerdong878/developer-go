import { wild as roster, type WildSpecies } from "@/content";
import { slots, walkable } from "./base";
import type { Vec2 } from "./geometry";

/** A wild Pokémon out on the map right now. */
export type WildSpawn = { id: number; species: WildSpecies; x: number; z: number; until: number };

/** How many are out at once, and how close to the trainer they show up. */
const COUNT = 8;
const NEAR = 12;
const FAR = 42;
/** Past this they despawn, like walking out of range in GO. */
const GONE = 70;

let spawns: WildSpawn[] = [];
let nextId = 1;
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
 * Keeps a handful of wild Pokémon around the trainer: new ones pop up in
 * the grass a short walk away, and old or far-off ones leave. Call it about
 * once a second.
 */
export function refreshWild(x: number, z: number, now: number, rand: () => number = Math.random) {
  const before = spawns.length;
  spawns = spawns.filter((s) => s.until > now && Math.hypot(s.x - x, s.z - z) < GONE);
  let changed = spawns.length !== before;
  for (let tries = 0; spawns.length < COUNT && tries < 40; tries++) {
    const a = rand() * Math.PI * 2;
    const d = NEAR + rand() * (FAR - NEAR);
    const p: Vec2 = [x + Math.cos(a) * d, z + Math.sin(a) * d];
    if (!openSpot(p)) continue;
    spawns = [...spawns, { id: nextId++, species: pick(rand), x: p[0], z: p[1], until: now + 60 + rand() * 60 }];
    changed = true;
  }
  if (changed) notify();
}

/** Caught (or ran off): gone from the map. */
export function removeWild(id: number) {
  spawns = spawns.filter((s) => s.id !== id);
  notify();
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
