import type { Items } from "./progress";

/*
 * GO's trainer levels since the Oct 2025 rebalance (notes/research/go-round-3.md 2):
 * 2,500 XP for level 2, 13,000 for 5, 48,000 for 10, up to 80. GO publishes
 * levels 2-10, 15 and 20 and every tenth after that; the ones between are
 * filled in on the same curve.
 */

export const MAX_LEVEL = 80;

/** Total XP to reach levels 0-20. 11-14 and 16-19 are in between GO's published ones. */
const TABLE = [0, 0, 2500, 5500, 9000, 13000, 18000, 24000, 31000, 39000, 48000, 59000, 72000, 86000, 101000, 118000, 140000, 165000, 193000, 224000, 258000];
/** GO's published totals from 20 up, every ten levels. */
const MILESTONES: [number, number][] = [
  [20, 258_000],
  [30, 1_083_000],
  [40, 3_953_000],
  [50, 12_753_000],
  [60, 34_353_000],
  [70, 85_853_000],
  [80, 203_353_000],
];

/** Total XP to reach a level. */
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  if (level <= 20) return TABLE[level];
  if (level > MAX_LEVEL) return Infinity;
  for (let k = 1; k < MILESTONES.length; k++) {
    const [a, xa] = MILESTONES[k - 1];
    const [b, xb] = MILESTONES[k];
    if (level <= b) return Math.round((xa * (xb / xa) ** ((level - a) / (b - a))) / 1000) * 1000;
  }
  return Infinity;
}

export function levelFor(xp: number) {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/**
 * What GO hands out at each level, cut to what this bag holds (Poké Balls,
 * Great Balls, Razz Berries). Levels 2-10 and 15 are GO's own; the rest follow
 * the same pattern.
 */
const REWARDS: Record<number, Partial<Items>> = {
  2: { ball: 10 },
  3: { ball: 10 },
  4: { ball: 10 },
  5: { ball: 15 },
  6: { ball: 10 },
  7: { ball: 15 },
  8: { ball: 10 },
  9: { ball: 10, razz: 3 },
  10: { ball: 20, razz: 3 },
  15: { great: 15, razz: 3 },
};

export const rewardsFor = (level: number): Partial<Items> => REWARDS[level] ?? (level < 15 ? { ball: 15, razz: 3 } : level < 20 ? { great: 10, razz: 3 } : { great: 20, razz: 5 });
