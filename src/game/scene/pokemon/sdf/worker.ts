/// <reference lib="webworker" />
import { RECIPES } from "../recipes";
import { openCache, readMesh, signature, writeMesh } from "./cache";
import { shinyRecipe } from "./shiny.js";
import { meshSpecies, transferables } from "./species.js";

/** Meshes one species off the main thread and hands the arrays back without copying. "shiny:25" is shiny Pikachu. */
export type Request = { id: number; dex: number | string; grid: number };

const recipeFor = (key: number | string) => {
  const m = /^shiny:(\d+)$/.exec(String(key));
  return m ? (shinyRecipe(Number(m[1]), RECIPES[Number(m[1])]) ?? RECIPES[Number(m[1])]) : RECIPES[key];
};

// in dev the worker's name doesn't change with the code, so the cache could go stale: mesh fresh every time there
const CACHE = process.env.NODE_ENV === "production";

self.onmessage = async (e: MessageEvent<Request>) => {
  const { id, dex, grid } = e.data;
  try {
    const recipe = recipeFor(dex);
    const key = `${dex}|${grid}`;
    const sig = CACHE ? signature(recipe, grid) : "";
    // a mesh from an earlier visit, if this build made it
    const cache = CACHE ? await openCache() : null;
    let out = await readMesh<ReturnType<typeof meshSpecies>>(cache, key, sig);
    if (!out) {
      out = meshSpecies(recipe, grid);
      writeMesh(cache, key, sig, out);
    }
    (self as unknown as Worker).postMessage({ id, dex, ...out }, transferables(out));
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, dex, error: String(err) });
  }
};
