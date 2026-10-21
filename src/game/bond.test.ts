import { describe, expect, it } from "vitest";
import { bondLevel, KM_PER_UNIT, walked } from "./bond";
import { progressStore } from "./progress";

describe("Teddy's bond", () => {
  it("climbs GO's buddy levels, scaled to a visit", () => {
    expect(bondLevel(0).level).toBe(null);
    expect(bondLevel(1).level?.name).toBe("Good Buddy");
    expect(bondLevel(7).level?.name).toBe("Great Buddy");
    expect(bondLevel(30).next).toBe(null);
  });

  it("earns a heart every 2 GO km walked together, but not on a dash", () => {
    const steps = Math.ceil(2.1 / KM_PER_UNIT / 2);
    for (let i = 0; i < steps; i++) walked(2, true);
    expect(progressStore.get().bond.hearts).toBe(0);
    for (let i = 0; i < steps; i++) walked(2, false);
    expect(progressStore.get().bond.hearts).toBe(1);
    expect(progressStore.get().bond.km).toBeGreaterThan(1.9);
  });
});
