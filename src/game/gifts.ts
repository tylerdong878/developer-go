import { stops } from "@/content";
import type { Items } from "./progress";

/*
 * GO's Gifts and Postcards (notes/research/go-round-4.md 2). Spinning a
 * project's PokéStop sometimes drops a gift with its postcard: the project's
 * picture and name. Like GO you can't open your own; you pin the postcard to
 * your Postcard Book, or send the gift to a friend, who opens it here and gets
 * GO's three bundles of items. GO's own limits: hold 20, open 30 a day, a book
 * of 350, 200 XP for each one sent.
 */

export const GIFT_HOLD = 20;
export const GIFT_OPEN_DAY = 30;
export const BOOK_MAX = 350;
export const SEND_XP = 200;
/** GO never published its drop rate; one spin in three feels right. */
export const GIFT_ODDS = 1 / 3;

export type Postcard = { slug: string; at: number; from: string };

export const isStop = (slug: string) => stops.some((s) => s.slug === slug);
export const stopName = (slug: string) => stops.find((s) => s.slug === slug)?.name ?? slug;

/** Where the stop's project lives on the postcard: Boston for most, Westwood for the ones at home. */
export function placeOf(slug: string) {
  const w = stops.find((s) => s.slug === slug)?.where;
  return w && "lat" in w && w.lat < 42.28 ? "Westwood, MA" : "Boston, MA";
}

/** GO's gift: three bundles, which can repeat, cut to this bag (Pinap Berries become Razz). */
export function bundles(rand = Math.random): Partial<Items>[] {
  const pool: Partial<Items>[] = [{ ball: 5 }, { great: 2 }, { razz: 2 }];
  return [0, 1, 2].map(() => pool[Math.floor(rand() * pool.length)]);
}

/** The link that sends a stop's gift to a friend. */
export const giftLink = (slug: string) => `${location.origin}/?gift=${encodeURIComponent(slug)}`;
