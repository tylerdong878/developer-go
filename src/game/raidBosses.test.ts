import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { raids } from "@/content";
import { RAID_BOSS } from "./raidBosses";
import { RECIPES } from "./scene/pokemon/recipes";

describe("raid bosses", () => {
  it("gives every hackathon a boss", () => {
    for (const r of raids) expect(RAID_BOSS[r.slug], r.slug).toBeDefined();
  });

  it("has a model and a portrait for every boss", () => {
    for (const boss of Object.values(RAID_BOSS)) {
      expect(RECIPES[boss.dex], boss.name).toBeDefined();
      expect(existsSync(`public/portraits/${boss.dex}.webp`), boss.name).toBe(true);
    }
  });
});
