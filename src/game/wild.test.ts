import { beforeEach, describe, expect, it } from "vitest";
import { holdWild, isOut, LEAVE, refreshWild, resetWild, RUSTLE, wildStore } from "./wild";

/** A steady fake random, so spots and timers repeat. */
function seeded(seed = 7) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe("wild spawns", () => {
  beforeEach(() => resetWild());

  it("trickles in one at a time instead of filling the map, the first one inside the ring", () => {
    const rand = seeded();
    refreshWild(0, 6, 0, rand);
    expect(wildStore.get()).toHaveLength(0);
    refreshWild(0, 6, 2, rand);
    expect(wildStore.get()).toHaveLength(1);
    const [s] = wildStore.get();
    expect(Math.hypot(s.x, s.z - 6)).toBeLessThan(9);
    refreshWild(0, 6, 3, rand);
    expect(wildStore.get()).toHaveLength(1);
    for (let t = 4; t <= 60; t++) refreshWild(0, 6, t, rand);
    expect(wildStore.get().length).toBeGreaterThan(4);
  });

  it("rustles first, then pops out", () => {
    refreshWild(0, 6, 8, seeded());
    refreshWild(0, 6, 10, seeded());
    const [s] = wildStore.get();
    expect(isOut(s, 10.5)).toBe(false);
    expect(isOut(s, 10 + RUSTLE)).toBe(true);
  });

  it("leaves when its time is up, then is gone", () => {
    const rand = seeded();
    refreshWild(0, 6, 0, rand);
    refreshWild(0, 6, 2, rand);
    const [s] = wildStore.get();
    // far enough from him that it doesn't linger
    refreshWild(20, 6, s.until, rand);
    expect(s.leaving).toBe(s.until);
    expect(isOut(s, s.until)).toBe(false);
    refreshWild(20, 6, s.until + LEAVE + 0.01, rand);
    expect(wildStore.get().includes(s)).toBe(false);
  });

  it("draws extra ones to a lured stop while he's near it, up to three", () => {
    const rand = seeded(3);
    const lures: [number, number][] = [[40, 40]];
    for (let t = 0; t <= 120; t++) refreshWild(40, 52, t, rand, { lures });
    const lured = wildStore.get().filter((s) => s.lured && s.leaving === null);
    expect(lured.length).toBeGreaterThan(0);
    expect(lured.length).toBeLessThanOrEqual(3);
    for (const s of lured) expect(Math.hypot(s.x - 40, s.z - 40)).toBeLessThanOrEqual(8.01);
  });

  it("never leaves while it's being caught, or while he's walking to it", () => {
    const rand = seeded();
    refreshWild(0, 6, 0, rand);
    refreshWild(0, 6, 2, rand);
    const [s] = wildStore.get();
    holdWild(s.id);
    refreshWild(20, 6, s.until + 5, rand);
    expect(s.leaving).toBe(null);
    holdWild(null);
    refreshWild(20, 6, s.until + 6, rand, { goal: `wild:${s.id}` });
    expect(s.leaving).toBe(null);
  });
});
