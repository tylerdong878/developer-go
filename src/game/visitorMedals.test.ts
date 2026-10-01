import { describe, expect, it } from "vitest";
import { gyms, spawns } from "@/content";
import { earned, visitorMedals } from "./visitorMedals";

const empty = { caught: {}, history: [], spun: [], visited: [], xp: 0, items: { ball: 0, great: 0, razz: 0 } };

describe("visitor medals", () => {
  it("starts with nothing earned", () => {
    expect(earned(empty)).toEqual([]);
  });

  it("counts every catch, and fact Pokémon only once each", () => {
    const facts = Object.fromEntries(spawns.slice(0, 5).map((s) => [s.pokemon.dex, 2]));
    const p = { ...empty, caught: facts };
    expect(earned(p)).toEqual(expect.arrayContaining(["first-catch", "collector", "fact-finder"]));
  });

  it("needs every gym for the gym tour", () => {
    const most = { ...empty, visited: gyms.slice(1).map((g) => g.slug) };
    expect(earned(most)).not.toContain("gym-tour");
    const all = { ...empty, visited: gyms.map((g) => g.slug) };
    expect(earned(all)).toContain("gym-tour");
    expect(visitorMedals(all).find((m) => m.id === "gym-tour")?.have).toBe(gyms.length);
  });
});
