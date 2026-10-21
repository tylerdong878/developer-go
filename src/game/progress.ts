"use client";

import { sfx } from "./sound";

/**
 * What this visitor has done, kept in their browser: Pokémon caught (by dex
 * number, plus a history of each catch), stops spun, places visited, raid eggs hatched, XP,
 * and the items in their bag. It's
 * only a convenience; if storage is blocked, everything still works for the visit.
 */
export type ItemId = "ball" | "great" | "razz";
export type Items = Record<ItemId, number>;

/** One catch, for the Pokémon screen: who, how strong, when, and how good the throw was. */
export type Catch = { id: number; dex: number; name: string; cp: number; at: number; throw: string | null; shiny?: boolean };

/** The Pokémon screen keeps the most recent catches, like GO's storage. */
export const HISTORY_MAX = 300;

/** Teddy's bond with this visitor, like a GO buddy's: hearts, GO km walked together, and today's play and treats. */
export type Bond = { hearts: number; km: number; played: string | null; fed: number; fedOn: string | null };
const NO_BOND: Bond = { hearts: 0, km: 0, played: null, fed: 0, fedOn: null };

export type Progress = {
  caught: Record<number, number>;
  history: Catch[];
  spun: string[];
  visited: string[];
  hatched: string[];
  bonus: Record<string, boolean>;
  bond: Bond;
  xp: number;
  items: Items;
};

/** What a new trainer starts with, like GO's starter bag. */
export const STARTER_ITEMS: Items = { ball: 20, great: 0, razz: 2 };

const KEY = "developer-go:progress";
const empty: Progress = { caught: {}, history: [], spun: [], visited: [], hatched: [], bonus: {}, bond: NO_BOND, xp: 0, items: STARTER_ITEMS };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...empty, ...saved, bond: { ...NO_BOND, ...saved.bond }, items: { ...STARTER_ITEMS, ...saved.items } };
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

export function recordHatch(slug: string) {
  const p = current();
  if (!p.hatched.includes(slug)) save({ ...p, hatched: [...p.hatched, slug] });
}

/** A raid's one bonus round is over: caught the boss, or it got away. */
export function recordBonus(slug: string, caught: boolean) {
  const p = current();
  if (!(slug in p.bonus)) save({ ...p, bonus: { ...p.bonus, [slug]: caught } });
}

export function saveBond(bond: Bond) {
  save({ ...current(), bond });
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

/** A pop up the screen: "+100 XP first visit", or just a line (amount 0), like "Teddy found a Poké Ball!". */
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

/** Floats a line up the screen with no XP. */
export function toast(why: string) {
  popUp(0, why);
}

/** Adds XP and floats a "+100 XP" up the screen, like GO. */
export function gainXp(amount: number, why: string) {
  addXp(amount);
  window.setTimeout(sfx.xp, 150);
  popUp(amount, why);
}

function popUp(amount: number, why: string) {
  const pop = { id: nextPop++, amount, why };
  pops = [...pops, pop];
  popListeners.forEach((l) => l());
  setTimeout(() => {
    pops = pops.filter((p) => p.id !== pop.id);
    popListeners.forEach((l) => l());
  }, 1800);
}
