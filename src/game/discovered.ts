import { spawns } from "@/content";
import { progressStore } from "./progress";

/**
 * Which fact Pokémon this visitor has found, like GO's Daily Encounter: each
 * one waits unseen at its spot until you first come close, then pops out and
 * stays. Ones you've caught before are found from the start, and so is
 * Snorlax, asleep across the road where you can't miss it.
 */
const always = spawns.filter((s) => s.pokemon.dex === 143).map((s) => s.slug);
let found: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

function current() {
  if (!found) {
    const caught = progressStore.get().caught;
    found = new Set([...always, ...spawns.filter((s) => caught[s.pokemon.dex]).map((s) => s.slug)]);
  }
  return found;
}

const none: ReadonlySet<string> = new Set(always);

export const foundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: current,
  server: () => none,
};

export function discover(slug: string) {
  const now = current();
  if (now.has(slug)) return;
  found = new Set([...now, slug]);
  listeners.forEach((l) => l());
}
