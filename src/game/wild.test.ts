import { beforeEach, describe, expect, it } from "vitest";
import { isOut, LEAVE, refreshWild, resetWild, RUSTLE, wildStore } from "./wild";

/** A steady fake random, so spots and timers repeat. */
function seeded(seed = 7) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe("wild spawns", () => {
  beforeEach(() => resetWild());

  it("trickles in one at a time instead of filling the map", () => {
    const rand = seeded();
    refreshWild(0, 6, 0, rand);
    expect(wildStore.get()).toHaveLength(1);
    refreshWild(0, 6, 1, rand);
    expect(wildStore.get()).toHaveLength(1);
    for (let t = 2; t <= 60; t++) refreshWild(0, 6, t, rand);
    expect(wildStore.get().length).toBeGreaterThan(4);
  });

  it("rustles first, then pops out", () => {
    refreshWild(0, 6, 10, seeded());
    const [s] = wildStore.get();
    expect(isOut(s, 10.5)).toBe(false);
    expect(isOut(s, 10 + RUSTLE)).toBe(true);
  });

  it("leaves when its time is up, then is gone", () => {
    const rand = seeded();
    refreshWild(0, 6, 0, rand);
    const [s] = wildStore.get();
    refreshWild(0, 6, s.until, rand);
    expect(s.leaving).toBe(s.until);
    expect(isOut(s, s.until)).toBe(false);
    refreshWild(0, 6, s.until + LEAVE + 0.01, rand);
    expect(wildStore.get().includes(s)).toBe(false);
  });
});
