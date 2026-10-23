/** `cp`: GO's catch CPs after a raid, level 20 with 10 to 15 IVs (from GO's base stats in its game data). */
export type RaidBoss = { dex: number; name: string; nod: string; cp: [number, number]; hover?: number };

/**
 * Who hatches from each hackathon's raid egg: a Pokémon that's really been a
 * GO raid boss at that tier (dated sources in notes/research/raid-bosses.md),
 * picked as a nod to the project. `hover` lifts the ones GO flies or floats
 * (Articuno flies, Cresselia and Geodude hover) off the platform, in gym units.
 */
export const RAID_BOSS: Record<string, RaidBoss> = {
  "bostonhacks-2024": { dex: 488, name: "Cresselia", nod: "the Lunar Pokémon, for a lunar lander sim", cp: [1555, 1633], hover: 0.3 },
  "civic-tech-2025": { dex: 144, name: "Articuno", nod: "Team Mystic's legendary bird, for Pokémon GO with real animals", cp: [1665, 1743], hover: 0.5 },
  "hackillinois-2025": { dex: 113, name: "Chansey", nod: "it carries a nest egg, for a savings app", cp: [654, 717] },
  "sthacks-2025": { dex: 143, name: "Snorlax", nod: "the Sleeping Pokémon, for a project called ManImTired", cp: [1760, 1843] },
  "hack-at-brown-2025": { dex: 74, name: "Geodude", nod: "a boulder that floats in GO, basically a tiny asteroid", cp: [688, 739], hover: 0.3 },
  "hackbeanpot-2025": { dex: 1, name: "Bulbasaur", nod: "it's based on a frog, which is close enough to a toad", cp: [590, 637] },
  "hackharvard-2025": { dex: 4, name: "Charmander", nod: "the flame on its tail, for a fireball duel", cp: [516, 560] },
  "babson-buildathon-2026": { dex: 63, name: "Abra", nod: "it reads minds, for brain analytics", cp: [712, 767] },
};

/**
 * GO's bonus round after a raid: one try at catching the boss, with Premier
 * Balls only. GO hands out a base 6 plus more for how well the raid went, so a
 * hackathon that placed earns 4 more. GO's own odds are harsher (2% base for a
 * legendary); these are kinder, from easy 1-star bosses to hard 5-star ones.
 */
export const premierBalls = (raid: { result?: string }) => 6 + (raid.result ? 4 : 0);
export const BONUS_RATE: Record<1 | 3 | 5, number> = { 1: 0.35, 3: 0.22, 5: 0.12 };
export const bossCp = (boss: RaidBoss, roll: number) => Math.round(boss.cp[0] + roll * (boss.cp[1] - boss.cp[0]));

/** GO's hatch, in seconds: the egg shakes and glows, a white flash, then the boss pops up. */
export const HATCH = { shake: 1.6, flash: 0.45, rise: 0.5 };
/** When the raid's screen opens after a hatch, in ms. */
export const HATCH_MS = (HATCH.shake + HATCH.flash + HATCH.rise + 0.35) * 1000;
