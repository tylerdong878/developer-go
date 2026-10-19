/// <reference lib="webworker" />
import { RECIPES } from "../recipes";
import { meshSpecies, transferables } from "./species.js";

/** Meshes one species off the main thread and hands the arrays back without copying. */
export type Request = { id: number; dex: number | string; grid: number };

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, dex, grid } = e.data;
  try {
    const out = meshSpecies(RECIPES[dex], grid);
    (self as unknown as Worker).postMessage({ id, dex, ...out }, transferables(out));
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, dex, error: String(err) });
  }
};
