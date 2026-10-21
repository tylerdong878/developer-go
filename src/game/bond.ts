"use client";

import { cheer } from "./buddy";
import { addItems, type Bond, progressStore, saveBond, spendItem, toast } from "./progress";

/*
 * GO's buddy hearts, for Teddy (game master BUDDY_*, notes/research/
 * pokemon-go-world.md). Hearts come from walking together (one every 2 km),
 * playing (petting him, once a day) and treats (a Razz Berry, up to 3 a day).
 * Enough hearts make him a Good, Great, Ultra and then Best Buddy; from Great
 * on, he finds items as you walk, like GO's buddies. GO's buddy levels take
 * weeks (1 / 70 / 150 / 300 hearts), so ours are a tenth of that for a visit.
 */

/** GO kilometers per map unit: our pink ring (9) stands for GO's 80 m. */
export const KM_PER_UNIT = 0.08 / 9;
const KM_PER_HEART = 2;
const FEEDS_PER_DAY = 3;
/** From Great Buddy, he finds something about every GO kilometer. */
const KM_PER_FIND = 1;

export const LEVELS = [
  { name: "Good Buddy", hearts: 1 },
  { name: "Great Buddy", hearts: 7 },
  { name: "Ultra Buddy", hearts: 15 },
  { name: "Best Buddy", hearts: 30 },
] as const;

/** Where the bond stands: the level reached (or null), and the next one. */
export function bondLevel(hearts: number) {
  let at = -1;
  LEVELS.forEach((l, i) => {
    if (hearts >= l.hearts) at = i;
  });
  return { level: at >= 0 ? LEVELS[at] : null, next: LEVELS[at + 1] ?? null, index: at };
}

const today = () => new Date().toISOString().slice(0, 10);

function give(b: Bond, n: number, why: string): Bond {
  if (n <= 0) return b;
  const before = bondLevel(b.hearts).index;
  const next = { ...b, hearts: b.hearts + n };
  const after = bondLevel(next.hearts);
  cheer();
  toast(after.index > before && after.level ? `Teddy is now your ${after.level.name}!` : `Teddy earned a heart ${why}`);
  return next;
}

let pending = 0;

/** He walked this far (map units) beside you. A dash doesn't count, like GO not counting a drive. */
export function walked(units: number, dashing: boolean) {
  // a jump that big is a teleport (the first frame), not a walk; slow frames can still cover a few meters
  if (dashing || units <= 0 || units > 30) return;
  pending += units * KM_PER_UNIT;
  if (pending < 0.05) return;
  const b = progressStore.get().bond;
  const km = b.km + pending;
  pending = 0;
  let next: Bond = { ...b, km };
  next = give(next, Math.floor(km / KM_PER_HEART) - Math.floor(b.km / KM_PER_HEART), "for walking together");
  // a Great Buddy brings you things now and then
  if (bondLevel(next.hearts).index >= 1 && Math.floor(km / KM_PER_FIND) > Math.floor(b.km / KM_PER_FIND)) {
    const ball = Math.random() < 0.7;
    addItems(ball ? { ball: 1 } : { razz: 1 });
    toast(`Teddy found a ${ball ? "Poké Ball" : "Razz Berry"}!`);
  }
  saveBond(next);
}

/** Petting him: a heart the first time each day. */
export function played() {
  const b = progressStore.get().bond;
  if (b.played === today()) return;
  saveBond(give({ ...b, played: today() }, 1, "for playing"));
}

/** Can he have a treat now? */
export const canFeed = (b: Bond) => (b.fedOn === today() ? b.fed : 0) < FEEDS_PER_DAY;

/** A Razz Berry from the bag: a heart, up to three times a day. Returns whether he got it. */
export function feed() {
  const b = progressStore.get().bond;
  if (!canFeed(b) || !spendItem("razz")) return false;
  const fed = (b.fedOn === today() ? b.fed : 0) + 1;
  saveBond(give({ ...b, fed, fedOn: today() }, 1, "for the treat"));
  return true;
}
