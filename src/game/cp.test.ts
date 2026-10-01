import { describe, expect, it } from "vitest";
import { cpFor } from "./cp";

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
