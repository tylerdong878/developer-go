import { wild } from "@/content";

/** The highest CP a wild one rolls: rarer species roll higher, like GO's. */
const TOP_WILD = 1500;

/**
 * A combat power for a new encounter. Common wild Pokémon come in low,
 * rare ones higher, and the sparkly fact Pokémon are always strong.
 * `roll` is a random number from 0 to 1.
 */
export function cpFor(dex: number, rare: boolean, roll: number) {
  if (rare) return Math.round(900 + roll * 1100);
  const weight = wild.find((w) => w.dex === dex)?.weight ?? 5;
  const top = 120 + (TOP_WILD - 120) * (1 - (weight - 1) / 9);
  return Math.max(10, Math.round(10 + roll * top));
}

export type ThrowKind = "Nice" | "Great" | "Excellent" | null;

/** XP for a catch, like GO: a base amount, a throw bonus, and 500 for a new Pokédex entry. */
export function catchRewards(rare: boolean, best: ThrowKind, firstOfKind: boolean) {
  const rows: [string, number][] = [[rare ? "Fact Pokémon" : "Caught", rare ? 500 : 100]];
  if (best) rows.push([`${best} throw`, best === "Excellent" ? 100 : best === "Great" ? 50 : 10]);
  if (firstOfKind) rows.push(["New Pokédex entry", 500]);
  return rows;
}
