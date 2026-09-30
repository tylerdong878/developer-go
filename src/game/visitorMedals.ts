import { gyms, raids, spawns } from "@/content";
import type { Progress } from "./progress";

export type VisitorMedal = { id: string; title: string; detail: string; have: number; need: number };

const factDex = new Set(spawns.map((s) => s.pokemon.dex));

/** Medals for playing the base, worked out from what you've done (nothing extra is stored). */
export function visitorMedals(p: Progress): VisitorMedal[] {
  const catches = Object.values(p.caught).reduce((n, c) => n + c, 0);
  const facts = Object.keys(p.caught).filter((d) => factDex.has(Number(d))).length;
  const gymsSeen = gyms.filter((g) => p.visited.includes(g.slug)).length;
  const raidsSeen = raids.filter((r) => p.visited.includes(r.slug)).length;
  return [
    { id: "first-catch", title: "First Catch", detail: "Catch a Pokémon", have: Math.min(catches, 1), need: 1 },
    { id: "collector", title: "Collector", detail: "Catch 10 Pokémon", have: Math.min(catches, 10), need: 10 },
    { id: "fact-finder", title: "Fact Finder", detail: "Catch 5 of the sparkly fact Pokémon", have: Math.min(facts, 5), need: 5 },
    { id: "backpacker", title: "Backpacker", detail: "Spin 5 PokéStops", have: Math.min(p.spun.length, 5), need: 5 },
    { id: "gym-tour", title: "Gym Tour", detail: "Visit every gym (all my jobs)", have: gymsSeen, need: gyms.length },
    { id: "raid-party", title: "Raid Party", detail: "Visit every raid (all my hackathons)", have: raidsSeen, need: raids.length },
    { id: "explorer", title: "Explorer", detail: "Open 20 things on the base", have: Math.min(p.visited.length, 20), need: 20 },
  ];
}

export const earned = (p: Progress) => visitorMedals(p).filter((m) => m.have >= m.need).map((m) => m.id);
