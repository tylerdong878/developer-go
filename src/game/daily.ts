import { bostonDay } from "./field";
import type { Items } from "./progress";

/*
 * GO's daily beats (notes/research/go-round-3.md 3 and 4).
 *
 * Streaks: the first catch and the first spin of each day. Days 1 to 6 give a
 * bonus, day 7 a big one, then it starts over; miss a day and it starts over.
 *
 * Research Breakthrough: a stamp the first time you claim a Field Research
 * reward each day, and seven of them open a Breakthrough. The days don't need
 * to be in a row.
 */

export type Streak = { day: string | null; n: number };
export const NO_STREAK: Streak = { day: null, n: 0 };

const dayBefore = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Today's first catch or spin: the streak's next day, or null if today's is already in. */
export function nextStreak(s: Streak, today = bostonDay()): Streak | null {
  if (s.day === today) return null;
  return { day: today, n: s.day === dayBefore(today) && s.n < 7 ? s.n + 1 : 1 };
}

/** Where a streak stands today: days in a row so far (0 once it's broken), and whether today's is in. */
export function streakNow(s: Streak, today = bostonDay()) {
  if (s.day === today) return { n: s.n, today: true };
  if (s.day === dayBefore(today) && s.n < 7) return { n: s.n, today: false };
  return { n: 0, today: false };
}

/** GO's bonuses: a catch is 1,500 XP a day and 6,000 on day 7; a spin 500 and 2,000, with extra items. */
export const catchBonus = (n: number) => (n === 7 ? { xp: 6000, why: "7-day catch streak!" } : { xp: 1500, why: "first catch of the day" });
export const spinBonus = (n: number): { xp: number; why: string; items: Partial<Items> } =>
  n === 7 ? { xp: 2000, why: "7-day spin streak!", items: { great: 3, razz: 2 } } : { xp: 500, why: "first spin of the day", items: { ball: 3 } };

export const STAMPS = 7;

/** A Field Research reward was claimed: today's stamp, if there isn't one yet. The new list, or null. */
export function stampWith(stamps: string[], today = bostonDay()): string[] | null {
  if (stamps.includes(today) || stamps.length >= STAMPS) return null;
  return [...stamps, today];
}

/** GO's Breakthrough: 3,000 XP, a mystery item, and an encounter from the season's pool (ours has Dratini). */
export const BREAKTHROUGH_XP = 3000;
export const BREAKTHROUGH_DEX = 147;
/** GO's mystery items, cut to this bag: 20 Poké Balls, or Great Balls for its Ultra Balls, or Razz for its Pinaps. */
export const mysteryItem = (r: number): Partial<Items> => (r < 0.4 ? { ball: 20 } : r < 0.7 ? { great: 5 } : { razz: 5 });
