import { eggs } from "./eggs";
import { gyms } from "./experience";
import { raids } from "./hackathons";
import { stops } from "./projects";
import { spawns } from "./spawns";
import type { MapObject } from "./types";

export { eggs, gyms, raids, spawns, stops };
export { bag } from "./bag";
export { wild } from "./wild";
export type { WildSpecies } from "./wild";
export type { BagItem } from "./bag";
export { medals } from "./medals";
export { mapCenter, places, signposts } from "./places";
export { skills } from "./skills";
export type { SkillId, SkillKind } from "./skills";
export { trainer } from "./trainer";
export type * from "./types";

/** Everything that lives on the map. */
export const mapObjects: MapObject[] = [
  ...gyms,
  ...stops,
  ...raids,
  ...spawns,
  ...eggs,
];
