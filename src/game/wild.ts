import { spawns as facts, stops } from "@/content";
import { slots, walkable } from "./base";
import type { Vec2 } from "./geometry";
import { type Appearance, appearanceAt, buildPoints, type Env, hash, nameOf, PointGrid, tableFor, habitatOf, type SpawnPoint } from "./spawnPoints";
import { random } from "./geometry";
import type { Weather } from "./weather";

/*
 * The wild Pokémon around the trainer, like GO (notes/research/spawn-points.md).
 * They come from the shared spawn points in spawnPoints.ts, so what's out at a
 * spot right now is the same for everyone. What's yours alone: the ones you
 * caught or that fled from you are gone for you (until they'd have left
 * anyway), and your Daily Encounter. Run from one and it stays.
 */

export type WildSpecies = { dex: number; name: string; weight: number };

export type WildSpawn = {
  /** Its shared key: the point and the hour it came out in. */
  id: string;
  /** What it really is. */
  species: WildSpecies;
  /** What it looks like on the map until it's caught (Ditto's disguise). */
  looks?: { dex: number; name: string };
  x: number;
  z: number;
  /** On the scene clock: when it popped out here (the rustle plays if it just fired), and when it started to leave. */
  born: number;
  leaving: number | null;
  /** When it goes, on the wall clock. */
  until: number;
  /** Drawn in by a lured stop: pink petals, and out of Nearby, like GO. */
  lured?: boolean;
  /** Your Daily Encounter: a bright pulsing ring, out of Nearby, out all day. */
  daily?: boolean;
  /** One of the fact Pokémon: catching it shows the fact. */
  fact?: string;
};

/** GO draws wild Pokémon round you and forgets the rest. */
const RANGE = 26;
/** A point that fired this recently plays its rustle and pop when you're there to see it. */
const FRESH = 2500;
/** The leaves rustle this long before it pops out, and it takes this long to go. */
export const RUSTLE = 1.4;
export const LEAVE = 0.6;

const points = buildPoints();
const grid = new PointGrid(points);
export const spawnPoints = points;

/** The fact species, by dex: catching one shows its fact. */
const FACT_OF = new Map(facts.map((f) => [f.pokemon.dex, f.slug]));

/* ---------------- this visitor's own state ---------------- */

const GONE_KEY = "developer-go:gone";
/** Caught or fled: gone for you until it would have left. */
let gone = new Map<string, number>();
try {
  const saved = JSON.parse(localStorage.getItem(GONE_KEY) ?? "[]") as [string, number][];
  gone = new Map(saved.filter(([, until]) => until > Date.now()));
} catch {
  // private mode: just this visit
}
function saveGone() {
  try {
    localStorage.setItem(GONE_KEY, JSON.stringify([...gone]));
  } catch {
    // still works this visit
  }
}

/* ---------------- lures ---------------- */

/** A lured stop draws one every 15 s window for a minute, from the stop's own habitat, shared like the rest. */
const LURE = { window: 15, life: 60, reach: 22, near: 3, far: 8 };
const lured: { slug: string; at: Vec2; i: number }[] = stops.filter((s) => s.featured && slots[s.slug]).map((s, i) => ({ slug: s.slug, at: slots[s.slug], i }));

function lureAppearances(x: number, z: number, at: number, env: Env): Appearance[] {
  const out: Appearance[] = [];
  for (const l of lured) {
    if (Math.hypot(l.at[0] - x, l.at[1] - z) > LURE.reach) continue;
    const w0 = Math.floor(at / 1000 / LURE.window);
    for (let w = w0 - LURE.life / LURE.window + 1; w <= w0; w++) {
      // about one window in three, so a lured stop keeps one or two about
      if (hash(900 + l.i, w) % 3) continue;
      const rand = random(hash(1000 + l.i, w));
      const a = rand() * Math.PI * 2;
      const d = LURE.near + rand() * (LURE.far - LURE.near);
      const p: Vec2 = [l.at[0] + Math.cos(a) * d, l.at[1] + Math.sin(a) * d];
      if (!walkable(p)) continue;
      const table = tableFor(habitatOf(p), env);
      let r = rand() * table.reduce((n, [, wt]) => n + wt, 0);
      let dex = table[0][0];
      for (const [d2, wt] of table) if ((r -= wt) < 0) {
        dex = d2;
        break;
      }
      const from = w * LURE.window * 1000;
      const point: SpawnPoint = { id: -1, x: p[0], z: p[1], habitat: habitatOf(p), offset: 0, long: false };
      out.push({ key: `lure:${l.i}:${w}`, point, dex, looks: dex, x: p[0], z: p[1], from, until: from + LURE.life * 1000 });
    }
  }
  return out;
}

/* ---------------- the Daily Encounter ---------------- */

/** GO's Daily Encounter: one Pokémon a day just for you, a few steps ahead when you arrive, out all day. */
const DAILY_KEY = "developer-go:daily";
/** Snorlax first (it's my favorite), then the rarest fact species you haven't caught. */
const DAILY_ORDER = [143, 137, 106, 95, 255];
const bostonDay = (at: number) => new Date(at).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
let daily: { day: string; dex: number; x: number; z: number } | null = null;
try {
  daily = JSON.parse(localStorage.getItem(DAILY_KEY) ?? "null");
} catch {}

function dailyAppearance(x: number, z: number, heading: number, at: number, caught: Record<number, number>): Appearance | null {
  const day = bostonDay(at);
  if (!daily || daily.day !== day) {
    const dex = DAILY_ORDER.find((d) => !caught[d]) ?? DAILY_ORDER[hash(Number(day.replaceAll("-", ""))) % DAILY_ORDER.length];
    // a few steps ahead of where he stands when the day's first visit starts
    let spot: Vec2 = [x + Math.sin(heading) * 6.5, z + Math.cos(heading) * 6.5];
    for (let k = 0; k < 8 && !walkable(spot); k++) spot = [x + Math.sin(heading + k) * 6.5, z + Math.cos(heading + k) * 6.5];
    daily = { day, dex, x: spot[0], z: spot[1] };
    try {
      localStorage.setItem(DAILY_KEY, JSON.stringify(daily));
    } catch {}
  }
  const end = new Date(`${day}T23:59:59-05:00`).getTime();
  const point: SpawnPoint = { id: -2, x: daily.x, z: daily.z, habitat: "park", offset: 0, long: true };
  return { key: `daily:${day}`, point, dex: daily.dex, looks: daily.dex, x: daily.x, z: daily.z, from: 0, until: end };
}

/* ---------------- the store ---------------- */

let spawns: WildSpawn[] = [];
/** The one being caught, which never leaves mid-throw. */
let held: string | null = null;
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

type Around = {
  /** The goal he's walking to, so that one doesn't leave before he gets there. */
  goal?: string | null;
  weather?: Weather | null;
  night?: boolean;
  /** The wall clock, epoch ms (tests pass their own). */
  at?: number;
  /** Which way he faces, for placing the Daily Encounter. */
  heading?: number;
  /** What he's caught, for picking the Daily Encounter. */
  caught?: Record<number, number>;
};

function toWild(a: Appearance, scene: number, at: number): WildSpawn {
  const real = a.dex;
  const species: WildSpecies = { dex: real, name: nameOf(real), weight: 1 };
  const fresh = at - a.from < FRESH;
  return {
    id: a.key,
    species,
    ...(a.looks !== real ? { looks: { dex: a.looks, name: nameOf(a.looks) } } : {}),
    x: a.x,
    z: a.z,
    born: fresh ? scene - (at - a.from) / 1000 : scene - 10,
    leaving: null,
    until: a.until,
    ...(a.key.startsWith("lure:") ? { lured: true } : {}),
    ...(a.key.startsWith("daily:") ? { daily: true } : {}),
    ...(FACT_OF.has(real) ? { fact: FACT_OF.get(real) } : {}),
  };
}

/**
 * Brings the map up to date round the trainer: what's out on the points near
 * him, minus what he's caught or scared off. Ones whose time is up leave in a
 * puff (unless he's catching it or walking to it); ones he walks away from are
 * forgotten. Call it about once a second.
 */
export function refreshWild(x: number, z: number, scene: number, { goal = null, weather = null, night = false, at = Date.now(), heading = 0, caught = {} }: Around = {}) {
  clock = scene;
  const env: Env = { weather, night, at };
  const want = new Map<string, Appearance>();
  for (const p of grid.near(x, z, RANGE)) {
    const a = appearanceAt(p, at, env);
    if (a && !gone.has(a.key)) want.set(a.key, a);
  }
  for (const a of lureAppearances(x, z, at, env)) if (!gone.has(a.key) && Math.hypot(a.x - x, a.z - z) <= RANGE) want.set(a.key, a);
  const d = dailyAppearance(x, z, heading, at, caught);
  if (d && !gone.has(d.key) && Math.hypot(d.x - x, d.z - z) <= RANGE * 2) want.set(d.key, d);

  let changed = false;
  const next: WildSpawn[] = [];
  for (const s of spawns) {
    const keep = s.id === held || goalId(s) === goal;
    if (s.leaving !== null) {
      if (scene - s.leaving < LEAVE) next.push(s);
      else changed = true;
      continue;
    }
    if (want.has(s.id) || keep) {
      next.push(s);
      want.delete(s.id);
      continue;
    }
    // time's up: a puff if he's close enough to see it, otherwise just gone
    if (at >= s.until && Math.hypot(s.x - x, s.z - z) < RANGE) {
      s.leaving = scene;
      next.push(s);
    }
    changed = true;
  }
  for (const a of want.values()) {
    next.push(toWild(a, scene, at));
    changed = true;
  }
  spawns = next;
  if (changed) notify();
}

/** The one in the catch screen stays put until the catch is over (null to let go). */
export function holdWild(id: string | null) {
  held = id;
}

/**
 * How an encounter ended, like GO: caught or fled, it's gone for you (until it
 * would have left anyway); ran, it's still there.
 */
export function endWild(id: string, outcome: "caught" | "fled" | "ran") {
  if (outcome === "ran") return;
  const s = spawns.find((w) => w.id === id);
  gone.set(id, s?.until ?? Date.now() + 3600_000);
  for (const [k, until] of gone) if (until < Date.now()) gone.delete(k);
  saveGone();
  spawns = spawns.filter((w) => w.id !== id);
  notify();
}

/** Back to an empty map (for tests). */
export function resetWild() {
  spawns = [];
  held = null;
  clock = 0;
  gone.clear();
  daily = null;
}
