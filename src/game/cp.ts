// A Pokémon's CP now comes from GO's own formula (power.ts).

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
