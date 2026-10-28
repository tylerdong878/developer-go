/**
 * Wild Pokémon that spawn around you just for fun, like GO's everyday
 * spawns. Weight is how common each one is. The fact Pokémon in spawns.ts
 * are separate: rare ones at fixed spots, each with something about me.
 */
export type WildSpecies = { dex: number; name: string; weight: number; /** the event that brings it, for the Pokédex */ event?: string };

export const wild: WildSpecies[] = [
  { dex: 16, name: "Pidgey", weight: 10 },
  { dex: 19, name: "Rattata", weight: 9 },
  { dex: 10, name: "Caterpie", weight: 7 },
  { dex: 13, name: "Weedle", weight: 7 },
  { dex: 41, name: "Zubat", weight: 6 },
  { dex: 129, name: "Magikarp", weight: 6 },
  { dex: 43, name: "Oddish", weight: 5 },
  { dex: 54, name: "Psyduck", weight: 5 },
  { dex: 60, name: "Poliwag", weight: 5 },
  { dex: 52, name: "Meowth", weight: 4 },
  { dex: 39, name: "Jigglypuff", weight: 4 },
  { dex: 74, name: "Geodude", weight: 4 },
  { dex: 66, name: "Machop", weight: 3 },
  { dex: 58, name: "Growlithe", weight: 3 },
  { dex: 92, name: "Gastly", weight: 3 },
  { dex: 63, name: "Abra", weight: 2 },
  { dex: 25, name: "Pikachu", weight: 2 },
  { dex: 1, name: "Bulbasaur", weight: 2 },
  { dex: 4, name: "Charmander", weight: 2 },
  { dex: 7, name: "Squirtle", weight: 2 },
  { dex: 147, name: "Dratini", weight: 1 },
];

/** Pokémon that only come out with an event, like GO's Halloween spawns (events.ts). */
export const eventWild: WildSpecies[] = [
  { dex: 355, name: "Duskull", weight: 0, event: "Halloween" },
  { dex: 607, name: "Litwick", weight: 0, event: "Halloween" },
  { dex: 624, name: "Pawniard", weight: 0, event: "Community Day" },
  { dex: 971, name: "Greavard", weight: 0, event: "Halloween" },
];
