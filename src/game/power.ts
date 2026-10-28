import { STATS } from "./stats";
import { communityDay } from "./events";

/*
 * GO's numbers behind a Pokémon (notes/research/go-round-5.md 1 and 2): its
 * level (1 to 50 in halves), its IVs (0 to 15 each), and the CP and HP they
 * give with its base stats; what a catch pays in Stardust and Candy; and what
 * a Power Up costs. Wild ones come in at level 1 up to your own level (30 at
 * most, 35 weather boosted), research and raid ones at GO's fixed levels.
 */

export type IVs = readonly [atk: number, def: number, sta: number];
export type Stats = { level: number; iv: IVs };

/** GO's CP multiplier at each whole level, 1 to 51 (index = level). */
const CPM = [
  0, 0.094, 0.16639787, 0.21573247, 0.25572005, 0.29024988, 0.3210876, 0.34921268, 0.37523559, 0.39956728, 0.42250001, 0.44310755, 0.46279839, 0.48168495, 0.49985844,
  0.51739395, 0.53435433, 0.55079269, 0.56675452, 0.58227891, 0.59740001, 0.61215729, 0.62656713, 0.64065295, 0.65443563, 0.667934, 0.68116492, 0.69414365, 0.70688421,
  0.71939909, 0.7317, 0.73776948, 0.74378943, 0.74976104, 0.75568551, 0.76156384, 0.76739717, 0.7731865, 0.77893275, 0.78463697, 0.79030001, 0.79530001, 0.8003, 0.8053,
  0.81029999, 0.81529999, 0.82029998, 0.82529998, 0.83029997, 0.83530003, 0.84030002, 0.84530002,
];

/** The multiplier at any half level: GO's half steps sit between the whole ones (flat steps from 40 up). */
export function cpm(level: number) {
  const l = Math.floor(level);
  if (level === l) return CPM[l];
  if (l >= 40) return CPM[l] + 0.0025;
  return Math.sqrt((CPM[l] ** 2 + CPM[l + 1] ** 2) / 2);
}

const base = (dex: number) => STATS[dex] ?? [100, 100, 100, 0, 0];

/** GO's CP: (Attack) * sqrt(Defense) * sqrt(Stamina) * CPM^2 / 10, at least 10. */
export function cpOf(dex: number, { level, iv }: Stats) {
  const [a, d, s] = base(dex);
  const m = cpm(level);
  return Math.max(10, Math.floor(((a + iv[0]) * Math.sqrt(d + iv[1]) * Math.sqrt(s + iv[2]) * m * m) / 10));
}

export function hpOf(dex: number, { level, iv }: Stats) {
  return Math.max(10, Math.floor((base(dex)[2] + iv[2]) * cpm(level)));
}

/** A wild one: level 1 up to your own (30 at most), five more when the weather boosts it, which also floors its IVs at 4. */
export function rollWild(trainer: number, boosted: boolean, rand: () => number): Stats {
  const top = Math.min(30, Math.max(1, trainer));
  const level = 1 + Math.floor(rand() * top) + (boosted ? 5 : 0);
  const floor = boosted ? 4 : 0;
  const iv = [0, 1, 2].map(() => floor + Math.floor(rand() * (16 - floor))) as unknown as IVs;
  return { level, iv };
}

/** Research rewards come at level 15 and raid bosses at 20 (25 boosted), IVs 10 to 15, like GO. */
export function rollFixed(level: number, rand: () => number): Stats {
  return { level, iv: [0, 1, 2].map(() => 10 + Math.floor(rand() * 6)) as unknown as IVs };
}

/** What a catch pays, like GO: 100 Stardust (a quarter more when it's weather boosted) and 3 Candy, plus the species' own extra. */
export function catchDust(dex: number, boosted: boolean) {
  return Math.round((100 + base(dex)[3]) * (boosted ? 1.25 : 1));
}
/** GO's catch Candy: 3, more for middle stages, and double on Community Day. */
export const catchCandy = (dex: number, at = Date.now()) => (3 + base(dex)[4]) * (communityDay(at) ? 2 : 1);

/** GO's Power Up costs for one half level, at the level it's at now (Candy XL from 40 isn't in this game). */
const COSTS: [below: number, dust: number, candy: number][] = [
  [3, 200, 1],
  [5, 400, 1],
  [7, 600, 1],
  [9, 800, 1],
  [11, 1000, 1],
  [13, 1300, 2],
  [15, 1600, 2],
  [17, 1900, 2],
  [19, 2200, 2],
  [21, 2500, 2],
  [23, 3000, 3],
  [25, 3500, 3],
  [26, 4000, 3],
  [27, 4000, 4],
  [29, 4500, 4],
  [31, 5000, 4],
  [33, 6000, 6],
  [35, 7000, 8],
  [37, 8000, 10],
  [39, 9000, 12],
  [40, 10000, 15],
];
export function powerCost(level: number) {
  const row = COSTS.find(([below]) => level < below);
  return row ? { dust: row[1], candy: row[2] } : null;
}

/** How high you can power one: your level plus 10, and 40 here (no Candy XL). */
export const powerCap = (trainer: number) => Math.min(40, trainer + 10);

/** The level and IVs of a catch saved before these existed: IVs from its id, and the level that gives its CP. */
export function guessStats(dex: number, id: number, cp: number): Stats {
  const h = (k: number) => {
    const x = Math.sin(id * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const iv = [0, 1, 2].map((k) => Math.floor(h(k) * 16)) as unknown as IVs;
  let best = 1;
  for (let l = 1; l <= 40; l += 0.5) if (Math.abs(cpOf(dex, { level: l, iv }) - cp) < Math.abs(cpOf(dex, { level: best, iv }) - cp)) best = l;
  return { level: best, iv };
}
