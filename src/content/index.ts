import { eggs } from "./eggs";
import { gyms } from "./experience";
import { raids } from "./hackathons";
import { stops } from "./projects";
import { spawns } from "./spawns";
import type { MapObject } from "./types";

export { eggs, gyms, raids, spawns, stops };
export { bag } from "./bag";
export { media } from "./media";
export { dexNo, pokedex } from "./pokedex";
export type { DexEntry } from "./pokedex";
export type { Media } from "./media";
export { badgeTier, monthsAt, tenure } from "./badges";
export type { BadgeTier } from "./badges";
export { eventWild, wild } from "./wild";
export type { WildSpecies } from "./wild";
export type { BagItem } from "./bag";
export { medals } from "./medals";
export { mapCenter, places, signposts } from "./places";
export { skills } from "./skills";
export type { SkillId, SkillKind } from "./skills";
export { trainer } from "./trainer";
export type * from "./types";

/** Everything that stands at a fixed spot on the map. (The fact Pokémon spawn at random, like any wild Pokémon.) */
export const mapObjects: MapObject[] = [...gyms, ...stops, ...raids, ...eggs];

/** Everything with a card: the map's objects and the fact Pokémon (whose cards open from the Pokédex). */
export const allObjects: MapObject[] = [...mapObjects, ...spawns];
