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

/** Flips once the visitor dismisses the intro (or arrives on a link straight to a card). */
let started = false;
const startListeners = new Set<() => void>();

export const startedStore = {
  subscribe(listener: () => void) {
    startListeners.add(listener);
    return () => startListeners.delete(listener);
  },
  get: () => started,
  server: () => false,
};

export function markStarted() {
  if (started) return;
  started = true;
  startListeners.forEach((l) => l());
}
