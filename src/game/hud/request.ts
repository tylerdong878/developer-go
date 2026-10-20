import type { Screen } from "./Menu";

/**
 * A screen asked for from outside the HUD (the intro's "Highlights" link),
 * held until the HUD is up to open it.
 */
let pending: Screen | null = null;
const listeners = new Set<() => void>();

export const screenRequest = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => pending,
  server: () => null,
};

export function requestScreen(screen: Screen) {
  pending = screen;
  listeners.forEach((l) => l());
}

export function clearScreenRequest() {
  pending = null;
  listeners.forEach((l) => l());
}
