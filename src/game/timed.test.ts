import { describe, expect, it } from "vitest";
import { taskFor } from "./field";
import { timedNow, timedWith } from "./timed";

describe("Halloween's research", () => {
  const during = Date.UTC(2026, 9, 28, 18);
  it("runs Timed Research only in Part I, counting what fits", () => {
    expect(timedNow(Date.UTC(2026, 9, 25))).toHaveLength(0);
    expect(timedNow(during)).toHaveLength(1);
    let s = timedWith({}, { kind: "catch", dex: 92, throw: null, curve: false, boosted: false }, during)!;
    s = timedWith(s, { kind: "surprise" }, during)!;
    expect(s["halloween-2026-1"].have).toEqual([1, 1, 0]);
    expect(timedWith(s, { kind: "catch", dex: 16, throw: null, curve: false, boosted: false }, during)).toBeNull();
  });

  it("gives about half the stops an event task with an event encounter", () => {
    const stops = ["etf-pipeline", "matching-engine", "ofi-regime-study", "imc-prosperity-4", "snakerl", "developer-go", "polar-glide", "nba-analyzer"];
    const spooky = stops.map((s) => taskFor(s, "2026-10-28")).filter((t) => ["ghost2", "surprise2", "catch5"].includes(t.task));
    expect(spooky.length).toBeGreaterThan(0);
    expect(spooky.length).toBeLessThan(stops.length);
    expect(spooky.every((t) => "encounter" in t.reward)).toBe(true);
  });
});
