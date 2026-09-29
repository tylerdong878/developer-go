"use client";

/**
 * What this visitor has done, kept in their browser: Pokémon caught (by dex
 * number), stops spun, places visited, and XP. It's only a convenience; if
 * storage is blocked, everything still works for the visit.
 */
export type Progress = {
  caught: Record<number, number>;
  spun: string[];
  visited: string[];
  xp: number;
};

const KEY = "developer-go:progress";
const empty: Progress = { caught: {}, spun: [], visited: [], xp: 0 };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {
    // Private mode or blocked storage: start fresh.
  }
  return empty;
}

let state: Progress | null = null;
const listeners = new Set<() => void>();

function current() {
  return (state ??= load());
}

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Still works for this visit.
  }
  listeners.forEach((l) => l());
}

export const progressStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: current,
  server: () => empty,
};

export function recordCatch(dex: number) {
  const p = current();
  save({ ...p, caught: { ...p.caught, [dex]: (p.caught[dex] ?? 0) + 1 } });
}

export function recordVisit(slug: string) {
  const p = current();
  if (!p.visited.includes(slug)) save({ ...p, visited: [...p.visited, slug] });
}

export function recordSpin(slug: string) {
  const p = current();
  if (!p.spun.includes(slug)) save({ ...p, spun: [...p.spun, slug] });
}

export function addXp(amount: number) {
  const p = current();
  save({ ...p, xp: p.xp + amount });
}
