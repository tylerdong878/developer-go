import { places, slots } from "./base";
import { REACH } from "./scene/Rings";
import { game } from "./state";
import { goalId, wildStore } from "./wild";

/**
 * The one thing in reach right now, so the HUD can offer to open it (press
 * E, or tap the prompt). Wild Pokémon win over everything else, then the
 * closest map object. Updated by the controller every frame; listeners only
 * hear about changes.
 */
let focus: string | null = null;
const listeners = new Set<() => void>();

export const focusStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => focus,
  server: () => null,
};

export function updateFocus(x: number, z: number) {
  let best: string | null = null;
  let bestD = REACH;
  for (const w of wildStore.get()) {
    const d = Math.hypot(w.x - x, w.z - z) - 2; // a Pokémon in reach comes first, like GO
    if (d < bestD) [best, bestD] = [goalId(w), d];
  }
  for (const slug of [...Object.keys(slots), ...Object.keys(places)]) {
    const [sx, sz] = slots[slug] ?? places[slug];
    const d = Math.hypot(sx - x, sz - z);
    if (d < bestD) [best, bestD] = [slug, d];
  }
  if (best === focus) return;
  focus = best;
  listeners.forEach((l) => l());
}

/** Open what's in reach: turn to face it and let the HUD take it from there, as if he'd walked up to it. */
export function interact() {
  if (!focus || game.input.paused || game.input.locked) return;
  game.input.target = null;
  game.input.goal = null;
  game.onArrive?.(focus);
}
