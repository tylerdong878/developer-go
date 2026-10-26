import { stops } from "@/content";
import { halloweenPart } from "./events";
import { hash } from "./spawnPoints";
import { SPECIES } from "./species";

/*
 * GO's Field Research (notes/research/spawn-points.md 5, go-features.md 2):
 * spinning a stop hands you its task for the day, the same task at that stop
 * for everyone, and you can hold three. Finishing one gives its reward:
 * items, XP, or an encounter, which is how you meet the fact Pokémon that GO
 * never puts in the wild (Rotom, Sirfetch'd, Alcremie). A research encounter
 * never flees.
 */

/** Something that happened that a task might count. */
export type FieldEvent =
  | { kind: "catch"; dex: number; throw: "Nice" | "Great" | "Excellent" | null; curve: boolean; boosted: boolean }
  | { kind: "spin"; slug: string }
  | { kind: "surprise" };

export type Reward = { encounter: number } | { xp: number } | { items: { ball?: number; great?: number; razz?: number } };

type TaskDef = { id: string; text: string; need: number; counts: (e: FieldEvent) => boolean };

const typeOf = (dex: number) => SPECIES[dex]?.types ?? [];
const catchOf = (test: (e: Extract<FieldEvent, { kind: "catch" }>) => boolean) => (e: FieldEvent) => e.kind === "catch" && test(e);

/** GO's everyday tasks, scaled to a short visit. */
const TASKS: TaskDef[] = [
  { id: "catch3", text: "Catch 3 Pokémon", need: 3, counts: catchOf(() => true) },
  { id: "great2", text: "Make 2 Great Throws", need: 2, counts: catchOf((e) => e.throw === "Great" || e.throw === "Excellent") },
  { id: "excellent", text: "Make an Excellent Throw", need: 1, counts: catchOf((e) => e.throw === "Excellent") },
  { id: "curve2", text: "Make 2 Curveball Throws", need: 2, counts: catchOf((e) => e.curve) },
  { id: "water2", text: "Catch 2 Water-type Pokémon", need: 2, counts: catchOf((e) => typeOf(e.dex).includes("water")) },
  { id: "normal3", text: "Catch 3 Normal-type Pokémon", need: 3, counts: catchOf((e) => typeOf(e.dex).includes("normal")) },
  { id: "bug2", text: "Catch 2 Bug-type Pokémon", need: 2, counts: catchOf((e) => typeOf(e.dex).includes("bug")) },
  { id: "boosted", text: "Catch a weather-boosted Pokémon", need: 1, counts: catchOf((e) => e.boosted) },
  { id: "spin3", text: "Spin 3 PokéStops", need: 3, counts: (e) => e.kind === "spin" },
];

/**
 * Halloween's event Field Research: GO's 2026 texts aren't out, so these are
 * in the style of 2025's ("Catch 10 Ghost- or Dark-type Pokémon" and so on),
 * shorter for a visit, each with an event encounter. Half the stops give one.
 */
const SPOOKY: (TaskDef & { reward: number })[] = [
  { id: "ghost2", text: "Catch 2 Ghost-type Pokémon", need: 2, counts: catchOf((e) => typeOf(e.dex).includes("ghost")), reward: 92 },
  { id: "surprise2", text: "Open 2 spooky surprises", need: 2, counts: (e) => e.kind === "surprise", reward: 25 },
  { id: "catch5", text: "Catch 5 Pokémon", need: 5, counts: catchOf(() => true), reward: 41 },
];

/** The encounters research hands out: the fact Pokémon you can't find in the wild first, then rare ones. */
const ENCOUNTERS = [479, 865, 869, 137, 106];

export type FieldTask = { stop: string; day: string; task: string; text: string; need: number; have: number; reward: Reward; claimed: boolean };

/** The Boston date, so the day's tasks turn over at Boston midnight. */
export const bostonDay = (at = Date.now()) => new Date(at).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

const stopIndex = new Map(stops.map((s, i) => [s.slug, i]));

/** The task a stop gives today: the same for everyone. Some stops give an encounter, the rest items or XP. */
export function taskFor(stop: string, day: string): FieldTask {
  const i = stopIndex.get(stop) ?? 0;
  const d = Number(day.replaceAll("-", ""));
  // Halloween's tasks at half the stops (Trick or Treat's only runs in Part I)
  const part = halloweenPart(Date.parse(`${day}T17:00:00Z`));
  if (part && hash(i, d, 17) % 2 === 0) {
    const pool = part === 1 ? SPOOKY : SPOOKY.filter((t) => t.id !== "surprise2");
    const t = pool[hash(i, d, 19) % pool.length];
    return { stop, day, task: t.id, text: t.text, need: t.need, have: 0, reward: { encounter: t.reward }, claimed: false };
  }
  const def = TASKS[hash(i, d, 7) % TASKS.length];
  const r = hash(i, d, 11) % 10;
  const reward: Reward =
    r < 5 ? { encounter: ENCOUNTERS[hash(i, d, 13) % ENCOUNTERS.length] } : r < 8 ? { items: { ball: 5, razz: 1 } } : { items: { great: 3 } };
  return { stop, day, task: def.id, text: def.text, need: def.need, have: 0, reward, claimed: false };
}

/** You can hold three, like GO. */
export const HOLD = 3;

/** A stop was spun: add its task if there's room and you don't have it yet today. Returns the new list, or null if nothing changed. */
export function receive(tasks: FieldTask[], stop: string, day = bostonDay()): FieldTask[] | null {
  const today = tasks.filter((t) => t.day === day || (!t.claimed && t.have >= t.need));
  if (today.some((t) => t.stop === stop && t.day === day)) return null;
  if (today.filter((t) => !t.claimed).length >= HOLD) return null;
  return [...today, taskFor(stop, day)];
}

/** Something happened: count it toward any task it fits. */
export function progressWith(tasks: FieldTask[], e: FieldEvent): FieldTask[] {
  return tasks.map((t) => {
    const def = TASKS.find((d) => d.id === t.task) ?? SPOOKY.find((d) => d.id === t.task);
    return def && !t.claimed && t.have < t.need && def.counts(e) ? { ...t, have: t.have + 1 } : t;
  });
}
