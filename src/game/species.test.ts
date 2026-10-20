import { describe, expect, it } from "vitest";
import { spawns, wild } from "@/content";
import { RAID_BOSS } from "./raidBosses";
import { boosted, SPECIES } from "./species";

describe("species", () => {
  it("knows GO's types and rates for everything on the map", () => {
    const dexes = [...wild.map((w) => w.dex), ...spawns.map((s) => s.pokemon.dex), ...Object.values(RAID_BOSS).map((b) => b.dex)];
    for (const dex of dexes) expect(SPECIES[dex], `#${dex}`).toBeDefined();
  });

  it("boosts like GO's weather", () => {
    expect(boosted(54, "rain")).toBe(true); // Psyduck, water
    expect(boosted(54, "clear")).toBe(false);
    expect(boosted(16, "windy")).toBe(true); // Pidgey, flying
    expect(boosted(16, "partly")).toBe(true); // and normal
    expect(boosted(92, "fog")).toBe(true); // Gastly, ghost
  });
});
