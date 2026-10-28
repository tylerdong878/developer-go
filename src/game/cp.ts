// A Pokémon's CP now comes from GO's own formula (power.ts).
import { SPECIES } from "./species";

/**
 * GO's odds (notes/research/encounter.md 7): P = 1 - (1 - min(1, BCR / 2·CPM))^M,
 * with the species' base capture rate, a level 15 CP multiplier, and M the
 * ball x berry x throw x curveball multipliers.
 */
const CPM = 0.5174;
export const catchChance = (dex: number, m: number) => 1 - (1 - Math.min(1, (SPECIES[dex]?.capture ?? 0.3) / (2 * CPM))) ** m;

export type ThrowKind = "Nice" | "Great" | "Excellent" | null;

/** GO's throw bonuses today: Nice 20, Great 100, Excellent 1,000. */
const THROW_XP = { Nice: 20, Great: 100, Excellent: 1000 } as const;

/**
 * XP for a catch, like GO today (notes/research/encounter.md 6): 100 for the
 * catch, the throw bonus, 20 for a curveball, 50 for a first-ball catch, and
 * 1,000 for a new Pokédex entry. (A fact Pokémon is worth 500, ours.)
 */
export function catchRewards(rare: boolean, best: ThrowKind, firstOfKind: boolean, firstThrow = false, curve = false) {
  const rows: [string, number][] = [[rare ? "Fact Pokémon" : "Caught", rare ? 500 : 100]];
  if (best) rows.push([`${best} throw`, THROW_XP[best]]);
  if (curve) rows.push(["Curveball", 20]);
  if (firstThrow) rows.push(["First throw", 50]);
  if (firstOfKind) rows.push(["New Pokédex entry", 1000]);
  return rows;
}

/** GO pays a little even when one gets away. */
export const FLED_XP = 25;
