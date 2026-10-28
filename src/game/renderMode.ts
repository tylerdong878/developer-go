/**
 * How hard the 3D map should work right now (notes/research/perf.md, fix 1).
 * The map is CPU-bound (about 1,250 draws a frame), and it used to draw at
 * full speed behind everything. Now it:
 * - stops ("off") behind the catch screen and phone-sized full-screen sheets,
 *   where none of it shows;
 * - slows to 30 fps ("slow") behind a side card, the menu, Nearby, the start
 *   screen, or when the window isn't focused;
 * - runs full speed ("full") the rest of the time, or 30 fps with the
 *   battery saver on (device.ts).
 * The HUD reports what's covering the map; the scene's Throttle reads this.
 */
export type RenderMode = "full" | "slow" | "off";

/** What the HUD says is over the map. */
export type Cover = "none" | "side" | "full" | "encounter";

let cover: Cover = "none";
const listeners = new Set<() => void>();

export const coverStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => cover,
};

export function setCover(next: Cover) {
  if (next === cover) return;
  cover = next;
  listeners.forEach((l) => l());
}

/** The mode for what's covering it, whether the intro is up, whether the window has focus, and the battery saver. */
export function modeFor(c: Cover, intro: boolean, focused: boolean, hidden: boolean, saver = false): RenderMode {
  if (hidden || c === "encounter" || c === "full") return "off";
  if (c === "side" || intro || !focused || saver) return "slow";
  return "full";
}

export const SLOW_FPS = 30;

/** The mode the scene's in right now (the frame-rate scaler ignores slowed frames). */
let mode: RenderMode = "full";
export const currentMode = () => mode;
export const setMode = (next: RenderMode) => {
  mode = next;
};
