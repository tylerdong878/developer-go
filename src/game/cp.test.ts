import { describe, expect, it } from "vitest";
import { catchRewards, cpFor } from "./cp";

describe("cpFor", () => {
  it("keeps every roll at 10 or more", () => {
    expect(cpFor(16, false, 0)).toBe(10);
  });
  it("rolls rare species higher than common ones", () => {
    expect(cpFor(147, false, 1)).toBeGreaterThan(cpFor(16, false, 1));
  });
  it("makes fact Pokémon strong", () => {
    expect(cpFor(25, true, 0)).toBeGreaterThanOrEqual(900);
    expect(cpFor(25, true, 1)).toBeLessThanOrEqual(2000);
  });
});

describe("catchRewards", () => {
  it("pays for the catch, the throw, and a new entry", () => {
    expect(catchRewards(false, "Great", true)).toEqual([
      ["Caught", 100],
      ["Great throw", 50],
      ["New Pokédex entry", 500],
    ]);
  });
  it("pays a plain catch only the base", () => {
    expect(catchRewards(false, null, false)).toEqual([["Caught", 100]]);
  });
});
