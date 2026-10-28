import { describe, expect, it } from "vitest";
import { taskFor } from "./field";
import { tableFor } from "./spawnPoints";
import { timedNow, timedWith } from "./timed";

describe("Halloween's research", () => {
  const during = Date.UTC(2026, 9, 28, 18);
  const part2 = Date.UTC(2026, 10, 3, 18);
  it("runs each part's Timed Research in its own part, counting what fits", () => {
    expect(timedNow(Date.UTC(2026, 9, 25))).toHaveLength(0);
    expect(timedNow(during).map((t) => t.id)).toEqual(["halloween-2026-1"]);
    expect(timedNow(part2).map((t) => [t.id, t.reward.encounter])).toEqual([["halloween-2026-2", 971]]);
    let s = timedWith({}, { kind: "catch", dex: 92, throw: null, curve: false, boosted: false }, during)!;
    s = timedWith(s, { kind: "surprise" }, during)!;
    expect(s["halloween-2026-1"].have).toEqual([1, 1, 0]);
    expect(timedWith(s, { kind: "catch", dex: 16, throw: null, curve: false, boosted: false }, during)).toBeNull();
  });

  it("gives about half the stops an event task with an event encounter", () => {
    const stops = ["etf-pipeline", "matching-engine", "ofi-regime-study", "imc-prosperity-4", "snakerl", "developer-go", "polar-glide", "nba-analyzer"];
    const spooky = stops.map((s) => taskFor(s, "2026-10-28")).filter((t) => ["ghost2", "nice3", "surprise2"].includes(t.task));
    expect(spooky.length).toBeGreaterThan(0);
    expect(spooky.length).toBeLessThan(stops.length);
    expect(spooky.every((t) => "encounter" in t.reward)).toBe(true);
    // Part II's give its own two
    const late = stops.map((s) => taskFor(s, "2026-11-03")).filter((t) => ["ghost3", "catch5"].includes(t.task));
    expect(late.length).toBeGreaterThan(0);
    expect(late.every((t) => "encounter" in t.reward && [607, 971].includes(t.reward.encounter))).toBe(true);
  });

  it("brings out GO's 2026 pools: Duskull in Part I, Litwick and Greavard in Part II, no extra Gastly", () => {
    const env = (at: number) => ({ weather: null, night: false, at });
    const weight = (at: number, dex: number) => tableFor("park", env(at)).find(([d]) => d === dex)?.[1] ?? 0;
    const before = Date.UTC(2026, 9, 20, 18);
    expect(weight(before, 355)).toBe(0);
    expect(weight(during, 355)).toBeGreaterThan(0);
    expect(weight(during, 607)).toBe(0);
    expect(weight(part2, 355)).toBe(0);
    expect(weight(part2, 607)).toBeGreaterThan(0);
    expect(weight(part2, 971)).toBeGreaterThan(0);
    expect(weight(during, 92)).toBe(weight(before, 92));
    expect(tableFor("water", env(part2)).some(([d]) => d === 971)).toBe(false);
  });
});
