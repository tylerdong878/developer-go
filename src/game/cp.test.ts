import { describe, expect, it } from "vitest";
import { catchRewards } from "./cp";

describe("catchRewards", () => {
  it("pays for the catch, the throw, a first-ball catch, and a new entry, at GO's rates", () => {
    expect(catchRewards(false, "Great", true, true)).toEqual([
      ["Caught", 100],
      ["Great throw", 100],
      ["First throw", 50],
      ["New Pokédex entry", 1000],
    ]);
  });
  it("pays a plain catch only the base", () => {
    expect(catchRewards(false, null, false)).toEqual([["Caught", 100]]);
  });
});
