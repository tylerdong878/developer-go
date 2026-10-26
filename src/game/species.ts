import type { Weather } from "./weather";

/** Pokémon types. */
export type PokeType =
  | "normal"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

type Facts = { types: PokeType[]; capture: number; flee: number };

/**
 * What GO's game master says about each species on the map: its types, and
 * its base capture and flee rates. GO stripped the rates in May 2023, so they
 * come from the last game master that had them
 * (.cache/research/gm/capture-rates-2023-05.json, notes/research/encounter.md 7).
 */
export const SPECIES: Record<number, Facts> = {
  1: { types: ["grass", "poison"], capture: 0.2, flee: 0.1 },
  4: { types: ["fire"], capture: 0.2, flee: 0.1 },
  7: { types: ["water"], capture: 0.2, flee: 0.1 },
  10: { types: ["bug"], capture: 0.5, flee: 0.2 },
  13: { types: ["bug", "poison"], capture: 0.5, flee: 0.2 },
  16: { types: ["normal", "flying"], capture: 0.5, flee: 0.2 },
  19: { types: ["normal"], capture: 0.5, flee: 0.2 },
  25: { types: ["electric"], capture: 0.2, flee: 0.1 },
  39: { types: ["normal", "fairy"], capture: 0.5, flee: 0.1 },
  41: { types: ["poison", "flying"], capture: 0.5, flee: 0.2 },
  43: { types: ["grass", "poison"], capture: 0.6, flee: 0.15 },
  52: { types: ["normal"], capture: 0.5, flee: 0.15 },
  54: { types: ["water"], capture: 0.5, flee: 0.1 },
  56: { types: ["fighting"], capture: 0.5, flee: 0.1 },
  58: { types: ["fire"], capture: 0.3, flee: 0.1 },
  60: { types: ["water"], capture: 0.5, flee: 0.15 },
  63: { types: ["psychic"], capture: 0.5, flee: 0.99 },
  66: { types: ["fighting"], capture: 0.5, flee: 0.1 },
  74: { types: ["rock", "ground"], capture: 0.5, flee: 0.1 },
  81: { types: ["electric", "steel"], capture: 0.5, flee: 0.1 },
  92: { types: ["ghost", "poison"], capture: 0.4, flee: 0.1 },
  95: { types: ["rock", "ground"], capture: 0.2, flee: 0.09 },
  100: { types: ["electric"], capture: 0.5, flee: 0.1 },
  106: { types: ["fighting"], capture: 0.2, flee: 0.09 },
  113: { types: ["normal"], capture: 0.2, flee: 0.09 },
  129: { types: ["water"], capture: 0.7, flee: 0.15 },
  132: { types: ["normal"], capture: 0.2, flee: 0.1 },
  133: { types: ["normal"], capture: 0.4, flee: 0.1 },
  137: { types: ["normal"], capture: 0.4, flee: 0.09 },
  143: { types: ["normal"], capture: 0.05, flee: 0.09 },
  144: { types: ["ice", "flying"], capture: 0.03, flee: 0.1 },
  147: { types: ["dragon"], capture: 0.4, flee: 0.09 },
  255: { types: ["fire"], capture: 0.2, flee: 0.1 },
  479: { types: ["electric", "ghost"], capture: 0.3, flee: 0.1 },
  488: { types: ["psychic"], capture: 0.02, flee: 0.04 },
  865: { types: ["fighting"], capture: 0.1, flee: 0.07 },
  869: { types: ["fairy"], capture: 0.2, flee: 0.07 },
};

/**
 * How each one dodges in the catch screen, GO's movement types (game master
 * `movementType`, notes/research/encounter.md 4): most jump; hoverers slide
 * side to side, flyers rise, electric ones dart, psychic ones loop in a figure 8.
 */
export type Movement = "jump" | "hover" | "fly" | "electric" | "psychic" | "none";
const MOVES: Record<number, Movement> = {
  74: "hover",
  137: "hover",
  479: "hover",
  488: "hover",
  144: "fly",
  278: "fly",
  581: "fly",
  41: "electric",
  81: "electric",
  63: "psychic",
  92: "psychic",
  95: "none",
  129: "none",
  869: "none",
};
export const movementOf = (dex: number): Movement => MOVES[dex] ?? "jump";

/** GO's weather boosts, from its game master (WEATHER_AFFINITY_*, notes/research/spawns.md 4). */
export const BOOSTS: Record<Weather, PokeType[]> = {
  clear: ["grass", "ground", "fire"],
  partly: ["normal", "rock"],
  cloudy: ["fairy", "fighting", "poison"],
  rain: ["water", "electric", "bug"],
  snow: ["ice", "steel"],
  fog: ["dark", "ghost"],
  windy: ["dragon", "flying", "psychic"],
};

/** Does this weather boost this species? */
export const boosted = (dex: number, weather: Weather) => (SPECIES[dex]?.types ?? []).some((t) => BOOSTS[weather].includes(t));


/** GO spawns some species more at night (none only at night): from our roster, these (notes/research/spawns.md 5). */
export const NIGHT_OWLS = new Set([41, 43, 52, 92]);
