"use client";

import { sfx } from "./sound";

/**
 * What this visitor has done, kept in their browser: Pokémon caught (by dex
 * number, plus a history of each catch), stops spun, places visited, XP,
 * and the items in their bag. It's
 * only a convenience; if storage is blocked, everything still works for the visit.
 */
export type ItemId = "ball" | "great" | "razz";
export type Items = Record<ItemId, number>;

/** One catch, for the Pokémon screen: who, how strong, when, and how good the throw was. */
export type Catch = { id: number; dex: number; name: string; cp: number; at: number; throw: string | null };

/** The Pokémon screen keeps the most recent catches, like GO's storage. */
export const HISTORY_MAX = 300;

export type Progress = {
  caught: Record<number, number>;
  history: Catch[];
  spun: string[];
  visited: string[];
  xp: number;
  items: Items;
};

/** What a new trainer starts with, like GO's starter bag. */
export const STARTER_ITEMS: Items = { ball: 20, great: 0, razz: 2 };

const KEY = "developer-go:progress";
const empty: Progress = { caught: {}, history: [], spun: [], visited: [], xp: 0, items: STARTER_ITEMS };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...empty, ...saved, items: { ...STARTER_ITEMS, ...saved.items } };
    }
  } catch {
    // Private mode or blocked storage: start fresh.
  }
  return empty;
}

let state: Progress | null = null;
const listeners = new Set<() => void>();

function current() {
  return (state ??= load());
}

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Still works for this visit.
  }
  listeners.forEach((l) => l());
}

export const progressStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: current,
  server: () => empty,
};

export function recordCatch(c: Omit<Catch, "id" | "at">) {
  const p = current();
  const at = Date.now();
  const entry: Catch = { ...c, id: at + Math.random(), at };
  save({
    ...p,
    caught: { ...p.caught, [c.dex]: (p.caught[c.dex] ?? 0) + 1 },
    history: [entry, ...p.history].slice(0, HISTORY_MAX),
  });
}

/** Lets one go, like GO's transfer. The Pokédex still remembers you caught it. */
export function releaseCatch(id: number) {
  const p = current();
  save({ ...p, history: p.history.filter((c) => c.id !== id) });
}

export function recordVisit(slug: string) {
  const p = current();
  if (!p.visited.includes(slug)) save({ ...p, visited: [...p.visited, slug] });
}

export function recordSpin(slug: string) {
  const p = current();
  if (!p.spun.includes(slug)) save({ ...p, spun: [...p.spun, slug] });
}

/** Adds items to the bag (from a stop spin, say). */
export function addItems(found: Partial<Items>) {
  const p = current();
  const items = { ...p.items };
  for (const [id, n] of Object.entries(found) as [ItemId, number][]) items[id] += n;
  save({ ...p, items });
}

/** Uses one item if there's one left. Returns whether it did. */
export function spendItem(id: ItemId) {
  const p = current();
  if (p.items[id] <= 0) return false;
  save({ ...p, items: { ...p.items, [id]: p.items[id] - 1 } });
  return true;
}

export function addXp(amount: number) {
  const p = current();
  save({ ...p, xp: p.xp + amount });
}

/** XP to reach a level: 1,000 for level 2, then each level needs 1,000 more than the last. */
export const xpForLevel = (level: number) => (1000 * (level - 1) * level) / 2;
export const levelFor = (xp: number) => Math.floor((1 + Math.sqrt(1 + (8 * xp) / 1000)) / 2);

export type XpPop = { id: number; amount: number; why: string };
let pops: XpPop[] = [];
const noPops: XpPop[] = [];
let nextPop = 1;
const popListeners = new Set<() => void>();

export const popStore = {
  subscribe(listener: () => void) {
    popListeners.add(listener);
    return () => popListeners.delete(listener);
  },
  get: () => pops,
  server: () => noPops,
};

/** Adds XP and floats a "+100 XP" up the screen, like GO. */
export function gainXp(amount: number, why: string) {
  addXp(amount);
  window.setTimeout(sfx.xp, 150);
  const pop = { id: nextPop++, amount, why };
  pops = [...pops, pop];
  popListeners.forEach((l) => l());
  window.setTimeout(() => {
    pops = pops.filter((p) => p.id !== pop.id);
    popListeners.forEach((l) => l());
  }, 1800);
}
