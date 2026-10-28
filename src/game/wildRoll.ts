import { cpOf, rollWild } from "./power";
import { communityDay } from "./events";
import { COMMUNITY_SHINY_ODDS, rollShiny } from "./shiny";
import { hash } from "./spawnPoints";
import { boosted } from "./species";
import type { Weather } from "./weather";
import type { WildSpawn } from "./wild";

/** A random id for this browser, so a shiny is yours alone but stays shiny if you come back to it. */
export function visitor() {
  try {
    let id = localStorage.getItem("developer-go:visitor");
    if (!id) {
      id = Math.random().toString(36).slice(2);
      localStorage.setItem("developer-go:visitor", id);
    }
    return id;
  } catch {
    return "guest";
  }
}

const codes = (s: string) => [...s].map((c) => c.charCodeAt(0));

/**
 * What a wild one is when you meet it: its level, IVs and CP fixed per spawn
 * (so running and coming back finds the same one, like GO), stronger if the
 * weather boosts it, and whether it's shiny for you.
 */
export function rollSpawn(w: WildSpawn, level: number, weather: Weather | null) {
  const looks = w.looks?.dex ?? w.species.dex;
  const boost = weather && boosted(looks, weather) ? weather : undefined;
  const roll = (k: number) => hash(k, ...codes(w.id)) / 4294967296;
  // GO's level and IVs: level 1 up to yours (five more if the weather boosts it)
  let k = 1;
  const stats = rollWild(level, !!boost, () => roll(k++));
  const mine = hash(...codes(visitor()), ...codes(w.id)) / 4294967296;
  // the Community Day species is shiny far more often during its hours
  const odds = communityDay(Date.now()) === w.species.dex ? COMMUNITY_SHINY_ODDS : undefined;
  return { stats, cp: cpOf(w.species.dex, stats), boost, shiny: rollShiny(w.species.dex, odds, mine) };
}
