/// <reference lib="webworker" />
import { RECIPES } from "../recipes";
import { shinyRecipe } from "./shiny.js";
import { meshSpecies, transferables } from "./species.js";

/** Meshes one species off the main thread and hands the arrays back without copying. "shiny:25" is shiny Pikachu. */
export type Request = { id: number; dex: number | string; grid: number };

const recipeFor = (key: number | string) => {
  const m = /^shiny:(\d+)$/.exec(String(key));
  return m ? (shinyRecipe(Number(m[1]), RECIPES[Number(m[1])]) ?? RECIPES[Number(m[1])]) : RECIPES[key];
};

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, dex, grid } = e.data;
  try {
    const out = meshSpecies(recipeFor(dex), grid);
    (self as unknown as Worker).postMessage({ id, dex, ...out }, transferables(out));
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, dex, error: String(err) });
  }
};
