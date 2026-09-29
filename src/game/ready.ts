/** Flips once the 3D scene has drawn its first frame, so the start screen can offer "Tap to start". */
let ready = false;
const listeners = new Set<() => void>();

export const readyStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => ready,
  server: () => false,
};

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}
