import { gyms, raids, spawns, stops } from "@/content";
import type { Items, Progress } from "./progress";

/*
 * Tyler's Special Research, the way GO tells a story: a few steps, each a
 * short line from Tyler and three tasks, with a reward to claim at the end
 * of every step. The tasks walk a visitor through the whole portfolio (his
 * jobs are gyms, his projects are stops, his hackathons are raids, the
 * sparkly Pokémon are facts about him), and the last step ends on his
 * trainer card: how to reach him. Progress comes from what the visitor has
 * already done; only the claimed steps are stored.
 */

export type Task = { text: string; need: number; count: (p: Progress) => number };
export type Reward = { xp: number; items: Partial<Items>; label: string };
export type Step = { title: string; story: string; tasks: Task[]; reward: Reward };

const gymSlugs = new Set(gyms.map((g) => g.slug));
const stopSlugs = new Set(stops.map((s) => s.slug));
const raidSlugs = new Set(raids.map((r) => r.slug));
const factDex = new Set(spawns.map((s) => s.pokemon.dex));

const visitedOf = (p: Progress, set: Set<string>) => p.visited.filter((s) => set.has(s)).length;
const caughtTotal = (p: Progress) => Object.values(p.caught).reduce((sum, n) => sum + n, 0);

export const STEPS: Step[] = [
  {
    title: "Welcome to Developer Town",
    story: "Hey, I'm Tyler! Every part of this town is something I've built or done. Let's start easy.",
    tasks: [
      { text: "Meet Tyler at the Pokémon Center", need: 1, count: (p) => (p.visited.includes("place:center") ? 1 : 0) },
      { text: "Spin a PokéStop", need: 1, count: (p) => p.spun.length },
      { text: "Catch a Pokémon", need: 1, count: caughtTotal },
    ],
    reward: { xp: 500, items: { ball: 5 }, label: "500 XP, 5 Poké Balls" },
  },
  {
    title: "On the Job",
    story: "Every gym downtown is a job I've had. The tall tower with the orange trim is AWS, where I interned in summer 2026.",
    tasks: [
      { text: "Visit the AWS gym", need: 1, count: (p) => (p.visited.includes("aws") ? 1 : 0) },
      { text: "Visit 3 gyms", need: 3, count: (p) => visitedOf(p, gymSlugs) },
      { text: "Catch 3 Pokémon", need: 3, count: caughtTotal },
    ],
    reward: { xp: 1000, items: { great: 3 }, label: "1,000 XP, 3 Great Balls" },
  },
  {
    title: "Builder",
    story: "PokéStops are my projects, and raids are the hackathons I've competed in. The quant ones are by the harbor.",
    tasks: [
      { text: "Spin 4 PokéStops", need: 4, count: (p) => p.spun.filter((s) => stopSlugs.has(s)).length },
      { text: "Check out 2 raids", need: 2, count: (p) => visitedOf(p, raidSlugs) },
      { text: "Visit 5 gyms", need: 5, count: (p) => visitedOf(p, gymSlugs) },
    ],
    reward: { xp: 1500, items: { razz: 3, great: 2 }, label: "1,500 XP, 3 Razz Berries, 2 Great Balls" },
  },
  {
    title: "Trainer Tyler",
    story: "The sparkly ones know the rest: the games I play, the sports, the dog. Find a few and you know me.",
    tasks: [
      { text: "Catch 3 sparkly Pokémon", need: 3, count: (p) => Object.keys(p.caught).filter((d) => factDex.has(Number(d))).length },
      { text: "Catch 10 Pokémon", need: 10, count: caughtTotal },
      { text: "Spin 6 PokéStops", need: 6, count: (p) => p.spun.filter((s) => stopSlugs.has(s)).length },
    ],
    reward: { xp: 2500, items: { ball: 10, great: 5 }, label: "2,500 XP and Tyler's trainer card" },
  },
];

/** Where a visitor is: the step they're on (STEPS.length when it's all done), and each task's progress there. */
export function researchState(p: Progress, claimed: number) {
  const step = Math.min(claimed, STEPS.length);
  const current = STEPS[step];
  const tasks = current ? current.tasks.map((t) => ({ ...t, done: Math.min(t.need, t.count(p)) })) : [];
  return { step, done: step >= STEPS.length, tasks, claimable: !!current && tasks.every((t) => t.done >= t.need) };
}

const KEY = "developer-go:research";
let claimed: number | null = null;
const listeners = new Set<() => void>();
const read = () => {
  if (claimed !== null) return claimed;
  try {
    claimed = Number(localStorage.getItem(KEY) ?? 0) || 0;
  } catch {
    claimed = 0;
  }
  return claimed;
};

/** How many steps this visitor has claimed, kept in their browser. */
export const researchStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: read,
  server: () => 0,
};

/** Marks the current step claimed (the caller pays out its reward). */
export function claimStep() {
  claimed = read() + 1;
  try {
    localStorage.setItem(KEY, String(claimed));
  } catch {
    // Still works for this visit.
  }
  listeners.forEach((l) => l());
}
