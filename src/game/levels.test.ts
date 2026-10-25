import { describe, expect, it } from "vitest";
import { levelFor, MAX_LEVEL, xpForLevel } from "./levels";

describe("trainer levels", () => {
  it("use GO's own numbers since the 2025 rebalance", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(2499)).toBe(1);
    expect(levelFor(2500)).toBe(2);
    expect(levelFor(13000)).toBe(5);
    expect(levelFor(48000)).toBe(10);
    expect(xpForLevel(40)).toBe(3_953_000);
    expect(xpForLevel(80)).toBe(203_353_000);
  });

  it("always need more XP for the next one, and stop at 80", () => {
    for (let l = 2; l <= MAX_LEVEL; l++) expect(xpForLevel(l), `level ${l}`).toBeGreaterThan(xpForLevel(l - 1));
    expect(levelFor(1e12)).toBe(MAX_LEVEL);
  });
});
