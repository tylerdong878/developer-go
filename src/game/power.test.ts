import { describe, expect, it } from "vitest";
import { catchCandy, catchDust, cpOf, guessStats, hpOf, powerCap, powerCost, rollWild } from "./power";

describe("GO's CP", () => {
  it("matches GO's own numbers", () => {
    // a perfect Pikachu at level 40 is CP 938, a perfect Snorlax 3,225, a level 1 Pidgey with no IVs 10
    expect(cpOf(25, { level: 40, iv: [15, 15, 15] })).toBe(938);
    expect(cpOf(143, { level: 40, iv: [15, 15, 15] })).toBe(3225);
    expect(cpOf(16, { level: 1, iv: [0, 0, 0] })).toBe(10);
    expect(hpOf(25, { level: 40, iv: [15, 15, 15] })).toBe(99);
  });

  it("pays and costs what GO does", () => {
    expect(catchDust(16, false)).toBe(100);
    expect(catchDust(16, true)).toBe(125);
    expect(catchDust(52, false)).toBe(500);
    expect(catchCandy(16)).toBe(3);
    expect(catchCandy(581)).toBe(5);
    expect(powerCost(1)).toEqual({ dust: 200, candy: 1 });
    expect(powerCost(26)).toEqual({ dust: 4000, candy: 4 });
    expect(powerCost(39.5)).toEqual({ dust: 10000, candy: 15 });
    expect(powerCost(40)).toBeNull();
    expect(powerCap(3)).toBe(13);
  });

  it("rolls wild ones no higher than you, and finds the level of an old catch", () => {
    let k = 0;
    const rand = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 50; i++) expect(rollWild(4, false, rand).level).toBeLessThanOrEqual(4);
    for (let i = 0; i < 50; i++) expect(rollWild(4, true, rand).iv.every((v) => v >= 4 && v <= 15)).toBe(true);
    const old = guessStats(143, 1234, 1500);
    expect(Math.abs(cpOf(143, old) - 1500)).toBeLessThan(60);
  });
});
