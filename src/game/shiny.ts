import { SHINY } from "./scene/pokemon/sdf/shiny.js";

/**
 * GO's shinies (notes/research/shiny.md): rolled when the encounter opens,
 * never shown on the map. GO's base odds are about 1 in 512 and about 1 in 20
 * for a 5-star raid boss; a visit is short, so ours are 1 in 64 (1 in 20 for
 * the big raids). Only species with a shiny in GO can be one. `?shiny` in the
 * address makes every one shiny, to see them.
 */
export const SHINY_ODDS = 1 / 64;
export const RAID_SHINY_ODDS = 1 / 20;
export const COMMUNITY_SHINY_ODDS = 1 / 10;

export const hasShiny = (dex: number) => !!SHINY[dex];

export function rollShiny(dex: number, odds = SHINY_ODDS, roll = Math.random()) {
  if (!hasShiny(dex)) return false;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("shiny")) return true;
  return roll < odds;
}

/** The portrait to show: the shiny one if it is. */
export const portrait = (dex: number, shiny = false) => `/portraits/${dex}${shiny && hasShiny(dex) ? "-shiny" : ""}.webp`;
