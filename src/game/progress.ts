"use client";

import { bostonDay, type FieldEvent, type FieldTask, progressWith, receive } from "./field";
import { levelFor, rewardsFor } from "./levels";
import { BREAKTHROUGH_XP, catchBonus, mysteryItem, NO_STREAK, nextStreak, spinBonus, STAMPS, type Streak, stampWith } from "./daily";
import { sfx } from "./sound";
import type { TeamId } from "./teams";

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
  /** Field Research held right now (three at most). */
  field: FieldTask[];
  /** GO's daily catch and spin streaks, and the Breakthrough stamps since the last one (daily.ts). */
  streaks: { catch: Streak; spin: Streak };
  stamps: string[];
  /** The team picked at level 5, like GO's, or null before that. */
  team: TeamId | null;
  /** Routes finished, by route, and the Boston day of the last one (GO's first route of the day pays double). */
  routes: Record<string, number>;
  routedOn: string | null;
  xp: number;
  items: Items;
};

/** What a new trainer starts with, like GO's starter bag. */
export const STARTER_ITEMS: Items = { ball: 20, great: 0, razz: 2 };

const KEY = "developer-go:progress";
const empty: Progress = { caught: {}, history: [], spun: [], visited: [], hatched: [], bonus: {}, bond: NO_BOND, field: [], streaks: { catch: NO_STREAK, spin: NO_STREAK }, stamps: [], team: null, routes: {}, routedOn: null, xp: 0, items: STARTER_ITEMS };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...empty, ...saved, bond: { ...NO_BOND, ...saved.bond }, streaks: { ...empty.streaks, ...saved.streaks }, items: { ...STARTER_ITEMS, ...saved.items } };
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
  // the day's first catch keeps GO's catch streak going
  const streak = nextStreak(p.streaks.catch);
  save({
    ...p,
    caught: { ...p.caught, [c.dex]: (p.caught[c.dex] ?? 0) + 1 },
    history: [entry, ...p.history].slice(0, HISTORY_MAX),
    streaks: streak ? { ...p.streaks, catch: streak } : p.streaks,
  });
  if (streak) {
    const bonus = catchBonus(streak.n);
    gainXp(bonus.xp, bonus.why);
  }
}

/** Any spin counts toward GO's daily spin streak; the first of the day gets its bonus. */
export function dailySpin() {
  const p = current();
  const streak = nextStreak(p.streaks.spin);
  if (!streak) return;
  const bonus = spinBonus(streak.n);
  save({ ...p, streaks: { ...p.streaks, spin: streak } });
  addItems(bonus.items);
  gainXp(bonus.xp, bonus.why);
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

/** A stop was spun: its Field Research task, if there's room. Returns the new task, if one was added. */
export function receiveField(stop: string) {
  const p = current();
  const next = receive(p.field, stop);
  if (!next) return null;
  save({ ...p, field: next });
  return next[next.length - 1];
}

/** Count something toward the Field Research you hold. */
export function fieldEvent(e: FieldEvent) {
  const p = current();
  const next = progressWith(p.field, e);
  if (next.some((t, i) => t.have !== p.field[i].have)) save({ ...p, field: next });
}

/** A finished task's reward is claimed, and the first claim of the day earns a Breakthrough stamp. */
export function claimField(stop: string, day: string) {
  const p = current();
  const task = p.field.find((t) => t.stop === stop && t.day === day && !t.claimed);
  if (!task) return;
  const stamps = stampWith(p.stamps);
  save({ ...p, field: p.field.map((t) => (t === task ? { ...t, claimed: true } : t)), stamps: stamps ?? p.stamps });
  if (stamps) toast(stamps.length >= STAMPS ? "Research stamp! Your Breakthrough is ready" : `Research stamp! ${STAMPS - stamps.length} more for a Breakthrough`);
}

/** A route's COMPLETE ROUTE: GO's 4,000 XP for the first of the day and 2,000 after, and an item. */
export function completeRoute(id: string) {
  const p = current();
  const today = bostonDay();
  const xp = p.routedOn === today ? 2000 : 4000;
  // GO's route rewards pool, cut to this bag
  const items: Partial<Items> = Math.random() < 0.5 ? { razz: 3 } : { great: 3 };
  save({ ...p, routes: { ...p.routes, [id]: (p.routes[id] ?? 0) + 1 }, routedOn: today });
  addItems(items);
  gainXp(xp, xp === 4000 ? "first route of the day" : "route complete");
  return { xp, items };
}

export function chooseTeam(team: TeamId) {
  const p = current();
  if (!p.team) save({ ...p, team });
}

/** Seven stamps open a Breakthrough: its XP and a mystery item go in now, its encounter comes next. */
export function claimBreakthrough() {
  const p = current();
  if (p.stamps.length < STAMPS) return false;
  save({ ...p, stamps: [] });
  addItems(mysteryItem(Math.random()));
  gainXp(BREAKTHROUGH_XP, "research breakthrough");
  return true;
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

export { levelFor, xpForLevel } from "./levels";

/** A level-up waiting to be shown: from, to, and what the new levels put in the bag. */
export type LevelUp = { from: number; to: number; items: Partial<Items> };
let levelUp: LevelUp | null = null;
const levelListeners = new Set<() => void>();
export const levelUpStore = {
  subscribe(listener: () => void) {
    levelListeners.add(listener);
    return () => levelListeners.delete(listener);
  },
  get: () => levelUp,
  server: () => null,
};
/** The level-up screen was closed. */
export function seenLevelUp() {
  levelUp = null;
  levelListeners.forEach((l) => l());
}

export function addXp(amount: number) {
  const p = current();
  const from = levelFor(p.xp);
  const to = levelFor(p.xp + amount);
  if (to <= from) return save({ ...p, xp: p.xp + amount });
  // like GO, each new level's rewards go straight in the bag, and the screen shows them
  const items = { ...p.items };
  const got: Partial<Items> = { ...levelUp?.items };
  for (let l = from + 1; l <= to; l++)
    for (const [id, n] of Object.entries(rewardsFor(l)) as [ItemId, number][]) {
      items[id] += n;
      got[id] = (got[id] ?? 0) + n;
    }
  save({ ...p, xp: p.xp + amount, items });
  levelUp = { from: levelUp?.from ?? from, to, items: got };
  levelListeners.forEach((l) => l());
}

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
