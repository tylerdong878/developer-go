import { describe, expect, it } from "vitest";
import { gyms, raids, spawns, stops } from "@/content";
import type { Progress } from "./progress";
import { researchState, STEPS } from "./research";

const fresh: Progress = { caught: {}, history: [], spun: [], visited: [], hatched: [], bonus: {}, bond: { hearts: 0, km: 0, played: null, fed: 0, fedOn: null }, field: [], streaks: { catch: { day: null, n: 0 }, spin: { day: null, n: 0 } }, stamps: [], team: null, xp: 0, items: { ball: 20, great: 0, razz: 2 } };

describe("Tyler's Special Research", () => {
  it("starts on step 1 with nothing done", () => {
    const s = researchState(fresh, 0);
    expect(s.step).toBe(0);
    expect(s.claimable).toBe(false);
    expect(s.tasks.every((t) => t.done === 0)).toBe(true);
  });

  it("can be finished using only things that exist on the map", () => {
    // a visitor who has done everything
    const p: Progress = {
      ...fresh,
      visited: ["place:center", ...gyms.map((g) => g.slug), ...raids.map((r) => r.slug)],
      spun: stops.map((s) => s.slug),
      caught: Object.fromEntries([...spawns.map((s) => [s.pokemon.dex, 1]), [16, 10]]),
    };
    for (let step = 0; step < STEPS.length; step++) expect(researchState(p, step).claimable, `step ${step + 1}`).toBe(true);
    expect(researchState(p, STEPS.length).done).toBe(true);
  });

  it("asks for no more of anything than the map has", () => {
    for (const step of STEPS)
      for (const t of step.tasks) {
        if (/gym/.test(t.text)) expect(t.need).toBeLessThanOrEqual(gyms.length);
        if (/PokéStop/.test(t.text)) expect(t.need).toBeLessThanOrEqual(stops.length);
        if (/raid/.test(t.text)) expect(t.need).toBeLessThanOrEqual(raids.length);
        if (/sparkly/.test(t.text)) expect(t.need).toBeLessThanOrEqual(spawns.length);
      }
  });
});
