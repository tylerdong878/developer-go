"use client";

import { bostonDay, type FieldEvent, type FieldTask, progressWith, receive } from "./field";
import { levelFor, rewardsFor } from "./levels";
import { TIMED, type TimedProgress, timedWith } from "./timed";
import { cpOf, guessStats, powerCap, powerCost, type Stats } from "./power";
import { BOOK_MAX, GIFT_HOLD, GIFT_OPEN_DAY, type Postcard, SEND_XP } from "./gifts";
import { BREAKTHROUGH_XP, catchBonus, mysteryItem, NO_STREAK, nextStreak, spinBonus, STAMPS, type Streak, stampWith } from "./daily";
import { sfx } from "./sound";
import type { TeamId } from "./teams";

/**
 * What this visitor has done, kept in their browser: Pokémon caught (by dex
 * number, plus a history of each catch), stops spun, places visited, raid eggs hatched, XP,
 * and the items in their bag. It's
 * only a convenience; if storage is blocked, everything still works for the visit.
 */
export type ItemId = "ball" | "great" | "razz" | "incense";
export type Items = Record<ItemId, number>;

/** One catch, for the Pokémon screen: who, how strong, when, and how good the throw was. */
export type Catch = {
  id: number;
  dex: number;
  name: string;
  cp: number;
  at: number;
  throw: string | null;
  shiny?: boolean;
  level?: number;
  iv?: readonly [number, number, number];
  /** GO's Location Card: the hackathon whose raid it came from. */
  card?: string;
};

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
  /** GO's gifts (gifts.ts): the ones you hold (by stop), your Postcard Book, the gift links you've opened, and today's opens. */
  gifts: string[];
  postcards: Postcard[];
  received: string[];
  openedOn: { day: string; n: number };
  xp: number;
  items: Items;
  /** GO's Stardust, and Candy by species (power.ts). */
  stardust: number;
  candy: Record<number, number>;
  /** When the lit Incense burns out (epoch ms), or null. */
  incenseUntil: number | null;
  /** Timed Research done so far, by event (timed.ts). */
  timed: TimedProgress;
};

/** What a new trainer starts with: GO gives 50 Poké Balls (notes/research/go-round-4.md 1). */
export const STARTER_ITEMS: Items = { ball: 50, great: 0, razz: 2, incense: 2 };

const KEY = "developer-go:progress";
const empty: Progress = { caught: {}, history: [], spun: [], visited: [], hatched: [], bonus: {}, bond: NO_BOND, field: [], streaks: { catch: NO_STREAK, spin: NO_STREAK }, stamps: [], team: null, routes: {}, routedOn: null, gifts: [], postcards: [], received: [], openedOn: { day: "", n: 0 }, xp: 0, items: STARTER_ITEMS, stardust: 0, candy: {}, incenseUntil: null, timed: {} };

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

export function recordCatch(c: Omit<Catch, "id" | "at">, dust = 0, candy = 0) {
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
    // GO's first catch of the day pays 1,800 Stardust too (9,000 on day 7)
    stardust: p.stardust + dust + (streak ? (streak.n === 7 ? 9000 : 1800) : 0),
    candy: { ...p.candy, [c.dex]: (p.candy[c.dex] ?? 0) + candy },
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
  const timed = timedWith(p.timed, e, Date.now());
  if (timed || next.some((t, i) => t.have !== p.field[i].have)) save({ ...p, field: next, timed: timed ?? p.timed });
}

/** A Timed Research finished: its items go in now; its encounter is the caller's to start. */
export function claimTimed(id: string) {
  const p = current();
  const t = TIMED.find((x) => x.id === id);
  const cur = p.timed[id];
  if (!t || !cur || cur.claimed || cur.have.some((n, i) => n < t.tasks[i].need)) return false;
  save({ ...p, timed: { ...p.timed, [id]: { ...cur, claimed: true } } });
  addItems(t.reward.items);
  gainXp(1000, "timed research");
  return true;
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

/** A spin dropped a gift from that stop, if there's room (GO holds 20). */
export function dropGift(slug: string) {
  const p = current();
  if (p.gifts.length >= GIFT_HOLD) return false;
  save({ ...p, gifts: [...p.gifts, slug] });
  return true;
}

/** Pin a postcard to the book (one of each stop from each sender). */
export function pinPostcard(slug: string, from: string) {
  const p = current();
  if (p.postcards.length >= BOOK_MAX || p.postcards.some((c) => c.slug === slug && c.from === from)) return;
  save({ ...p, postcards: [...p.postcards, { slug, from, at: Date.now() }] });
  toast("Pinned to your Postcard Book");
}

/** A gift went to a friend: it leaves your list, for GO's 200 XP. */
export function sendGift(k: number) {
  const p = current();
  save({ ...p, gifts: p.gifts.filter((_, i) => i !== k) });
  gainXp(SEND_XP, "sent a gift");
}

/** A friend's gift is opened: once per gift link, and 30 a day, like GO. Returns whether it counts. */
export function openGift(slug: string) {
  const p = current();
  const day = bostonDay();
  const n = p.openedOn.day === day ? p.openedOn.n : 0;
  if (n >= GIFT_OPEN_DAY || p.received.includes(slug)) return false;
  save({ ...p, received: [...p.received, slug], openedOn: { day, n: n + 1 } });
  return true;
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

/** A catch's level and IVs (worked out for ones saved before they were kept). */
export const statsOf = (c: Catch): Stats => (c.level && c.iv ? { level: c.level, iv: c.iv } : guessStats(c.dex, c.id, c.cp));

/** GO's Power Up: half a level for its Stardust and Candy, up to your level plus 10. Returns whether it went up. */
export function powerUp(id: number) {
  const p = current();
  const c = p.history.find((x) => x.id === id);
  if (!c) return false;
  const s = statsOf(c);
  const cost = powerCost(s.level);
  if (!cost || s.level >= powerCap(levelFor(p.xp)) || p.stardust < cost.dust || (p.candy[c.dex] ?? 0) < cost.candy) return false;
  const next: Stats = { level: s.level + 0.5, iv: s.iv };
  save({
    ...p,
    stardust: p.stardust - cost.dust,
    candy: { ...p.candy, [c.dex]: (p.candy[c.dex] ?? 0) - cost.candy },
    history: p.history.map((x) => (x.id === id ? { ...x, level: next.level, iv: next.iv, cp: cpOf(c.dex, next) } : x)),
  });
  return true;
}

/** GO's Incense: 60 minutes of Pokémon drawn to you (wild.ts). Returns whether one was lit. */
export function lightIncense(at = Date.now()) {
  const p = current();
  if (p.items.incense <= 0 || (p.incenseUntil ?? 0) > at) return false;
  save({ ...p, items: { ...p.items, incense: p.items.incense - 1 }, incenseUntil: at + 60 * 60 * 1000 });
  return true;
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
