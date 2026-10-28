import type { WildSpawn } from "./wild";

/*
 * GO's Explorer Gadget (Aug 2026, notes/research/go-features.md): built in
 * like GO Plus +, it throws Poké Balls (only Poké Balls) at Pokémon near you
 * while you're not playing, skips species you haven't caught yet and the
 * "mighty" ones, and shows afterward what it caught. GO's unlocks at level 20
 * and only runs with the app closed; ours unlocks at level 2 and runs while
 * you read a card, so reading pays too. One ball each: a miss and it flees.
 */
export const GADGET = { level: 2, every: 9_000, range: 30, perVisit: 20 };

/** The one it throws at next: the nearest one out that you've caught before, and not a special one. */
export function gadgetTarget(spawns: WildSpawn[], at: { x: number; z: number }, caught: Record<number, number>, out: (s: WildSpawn) => boolean) {
  let best: WildSpawn | null = null;
  let near: number = GADGET.range;
  for (const s of spawns) {
    // the "mighty" ones: fact Pokémon, your Daily Encounter, the starters, Halloween's boxes
    if (s.fact || s.daily || s.starter || s.surprise || !out(s)) continue;
    // GO skips species you haven't registered (a disguised Ditto counts as what it looks like)
    if (!caught[s.looks?.dex ?? s.species.dex]) continue;
    const d = Math.hypot(s.x - at.x, s.z - at.z);
    if (d < near) {
      near = d;
      best = s;
    }
  }
  return best;
}

/** "Pidgey", "Pidgey and Rattata", "Pidgey, Rattata and Zubat". */
export function listOf(names: string[]) {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** What it says when you close the card, like GO's gadget report. */
export function gadgetReport(caught: string[], fled: number) {
  if (!caught.length && !fled) return null;
  // the same one twice is "2 Pidgey", like GO's plurals
  const tally = new Map<string, number>();
  for (const n of caught) tally.set(n, (tally.get(n) ?? 0) + 1);
  const names = [...tally].map(([n, k]) => (k > 1 ? `${k} ${n}` : n));
  const got = names.length ? `caught ${listOf(names)}` : "";
  const ran = fled ? `${fled} got away` : "";
  return `While you were reading: ${[got, ran].filter(Boolean).join(", ")}`;
}
