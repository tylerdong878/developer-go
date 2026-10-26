import { EVENTS, halloweenPart } from "./events";
import type { FieldEvent } from "./field";
import type { Items } from "./progress";
import { SPECIES } from "./species";

/*
 * GO's Timed Research (notes/research/go-round-3.md 1, 4): free research that
 * comes with an event, sits in the Events tab, and goes when the event does.
 * Halloween 2026 Part I's real tasks aren't out yet (Oct 26), so these are
 * ours, short ones in GO's style; the reward is GO's own: a Pikachu encounter
 * (without the hat, which we haven't modeled), with Great Balls in place of
 * GO's Rare Candy.
 */

export type TimedTask = { text: string; need: number; counts: (e: FieldEvent) => boolean };
export type Timed = { id: string; name: string; to: number; tasks: TimedTask[]; reward: { encounter: number; items: Partial<Items> }; on: (at: number) => boolean };

const ghost = (e: FieldEvent) => e.kind === "catch" && (SPECIES[e.dex]?.types ?? []).includes("ghost");
const part1 = EVENTS.find((e) => e.id === "halloween-1")!;

export const TIMED: Timed[] = [
  {
    id: "halloween-2026-1",
    name: "Halloween 2026: Part I",
    to: part1.to,
    tasks: [
      { text: "Catch 3 Ghost-type Pokémon", need: 3, counts: ghost },
      { text: "Open 3 spooky surprises", need: 3, counts: (e) => e.kind === "surprise" },
      { text: "Spin 3 PokéStops", need: 3, counts: (e) => e.kind === "spin" },
    ],
    reward: { encounter: 25, items: { great: 3 } },
    on: (at) => halloweenPart(at) === 1,
  },
];

export const timedNow = (at: number) => TIMED.filter((t) => t.on(at));

export type TimedProgress = Record<string, { have: number[]; claimed: boolean }>;

/** Something happened: count it toward any Timed Research that's on. */
export function timedWith(state: TimedProgress, e: FieldEvent, at: number): TimedProgress | null {
  let changed = false;
  const next = { ...state };
  for (const t of timedNow(at)) {
    const cur = next[t.id] ?? { have: t.tasks.map(() => 0), claimed: false };
    if (cur.claimed) continue;
    const have = cur.have.map((n, i) => (n < t.tasks[i].need && t.tasks[i].counts(e) ? n + 1 : n));
    if (have.some((n, i) => n !== cur.have[i])) {
      next[t.id] = { ...cur, have };
      changed = true;
    }
  }
  return changed ? next : null;
}
