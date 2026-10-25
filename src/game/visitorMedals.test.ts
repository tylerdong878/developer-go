import { describe, expect, it } from "vitest";
import { gyms, spawns } from "@/content";
import { earned, visitorMedals } from "./visitorMedals";

const empty = { caught: {}, history: [], spun: [], visited: [], hatched: [], bonus: {}, bond: { hearts: 0, km: 0, played: null, fed: 0, fedOn: null }, field: [], streaks: { catch: { day: null, n: 0 }, spin: { day: null, n: 0 } }, stamps: [], team: null, routes: {}, routedOn: null, gifts: [], postcards: [], received: [], openedOn: { day: "", n: 0 }, xp: 0, items: { ball: 0, great: 0, razz: 0 } };

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

  it("gives the Shiny Hunter medal for a shiny catch", () => {
    const one = { id: 1, dex: 25, name: "Pikachu", cp: 300, at: 0, throw: null };
    expect(earned({ ...empty, history: [one] })).not.toContain("shiny-hunter");
    expect(earned({ ...empty, history: [{ ...one, shiny: true }] })).toContain("shiny-hunter");
  });
});
