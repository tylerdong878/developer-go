/**
 * Phones and small touch screens get a lighter render: fewer pixels, a
 * smaller shadow map, no shadows from street furniture, and fewer walkers. They look nearly the same on a small screen and keep
 * the frame rate up and the battery cooler.
 */
export function isLightDevice() {
  if (typeof window === "undefined") return false;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  return touch && small;
}

/*
 * Battery saver (notes/research/perf.md 11), like GO's: 30 frames a second
 * (GO's own default), one pixel per pixel, and the light render. "auto" turns
 * it on for a device that says it's weak (data saver, low battery, four cores
 * or less, 4 GB or less) or that still runs slow at the fewest pixels; or you
 * pick on or off in Settings.
 */
export type Saver = "auto" | "on" | "off";
const KEY = "developer-go:saver";
let choice: Saver | null = null;
let slowHere = false;
const listeners = new Set<() => void>();

export function saverChoice(): Saver {
  if (choice === null)
    try {
      const v = localStorage.getItem(KEY);
      choice = v === "on" || v === "off" ? v : "auto";
    } catch {
      choice = "auto";
    }
  return choice;
}

/** A device that says it will struggle. */
export function weakDevice() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return !!nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

export const saverOn = () => {
  const c = saverChoice();
  return c === "on" || (c === "auto" && (slowHere || weakDevice()));
};

const notify = () => listeners.forEach((l) => l());
export const saverStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => `${saverChoice()}:${saverOn()}`,
  server: () => "auto:false",
};

export function setSaver(next: Saver) {
  choice = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {}
  notify();
}

/** Auto's own call: this device runs slow (or its battery's low), so save it. True if that turned it on. */
export function slowDevice() {
  if (slowHere || saverChoice() !== "auto") return false;
  const was = saverOn();
  slowHere = true;
  notify();
  return !was;
}

/** Low battery and not charging counts as weak too (where the browser says). */
export function watchBattery() {
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
  nav.getBattery?.().then(
    (b) => {
      if (b.level < 0.2 && !b.charging) slowDevice();
    },
    () => {},
  );
}

export const renderBudget = (saving = saverOn()) =>
  saving || isLightDevice()
    ? { dpr: (saving ? [1, 1] : [1, 1.5]) as [number, number], shadowMap: 1024, light: true }
    : { dpr: [1, 2] as [number, number], shadowMap: 2048, light: false };
