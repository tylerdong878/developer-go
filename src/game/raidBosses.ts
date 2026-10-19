/**
 * Who hatches from each hackathon's raid egg: a Pokémon that's really been a
 * GO raid boss at that tier (dated sources in notes/research/raid-bosses.md),
 * picked as a nod to the project. `hover` lifts the ones GO flies or floats
 * (Articuno flies, Cresselia and Geodude hover) off the platform, in gym units.
 */
export type RaidBoss = { dex: number; name: string; nod: string; hover?: number };

export const RAID_BOSS: Record<string, RaidBoss> = {
  "bostonhacks-2024": { dex: 488, name: "Cresselia", nod: "the Lunar Pokémon, for a lunar lander sim", hover: 0.3 },
  "civic-tech-2025": { dex: 144, name: "Articuno", nod: "Team Mystic's legendary bird, for Pokémon GO with real animals", hover: 0.5 },
  "hackillinois-2025": { dex: 113, name: "Chansey", nod: "it carries a nest egg, for a savings app" },
  "sthacks-2025": { dex: 143, name: "Snorlax", nod: "the Sleeping Pokémon, for a project called ManImTired" },
  "hack-at-brown-2025": { dex: 74, name: "Geodude", nod: "basically a floating asteroid", hover: 0.3 },
  "hackbeanpot-2025": { dex: 1, name: "Bulbasaur", nod: "it's based on a frog, so it's the toad" },
  "hackharvard-2025": { dex: 4, name: "Charmander", nod: "a fireball on its tail" },
  "babson-buildathon-2026": { dex: 63, name: "Abra", nod: "it reads minds, for brain analytics" },
};

/** GO's hatch, in seconds: the egg shakes and glows, a white flash, then the boss pops up. */
export const HATCH = { shake: 1.6, flash: 0.45, rise: 0.5 };
/** When the raid's screen opens after a hatch, in ms. */
export const HATCH_MS = (HATCH.shake + HATCH.flash + HATCH.rise + 0.35) * 1000;
