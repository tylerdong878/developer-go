import { describe, expect, it } from "vitest";
import { gadgetReport, gadgetTarget } from "./gadget";
import type { WildSpawn } from "./wild";

const spawn = (id: string, dex: number, x: number, extra: Partial<WildSpawn> = {}): WildSpawn =>
  ({ id, species: { dex, name: `#${dex}`, weight: 1 }, x, z: 0, born: 0, leaving: null, until: Infinity, ...extra }) as WildSpawn;

describe("the Explorer Gadget", () => {
  const out = () => true;
  it("throws at the nearest one you've caught before, never a special one", () => {
    const spawns = [spawn("a", 16, 12), spawn("b", 19, 5), spawn("c", 25, 2), spawn("d", 16, 1, { fact: "ditto" }), spawn("e", 16, 1.5, { daily: true })];
    expect(gadgetTarget(spawns, { x: 0, z: 0 }, { 16: 1, 19: 2 }, out)?.id).toBe("b");
    // unregistered Pikachu is skipped, and so is anything out of range
    expect(gadgetTarget([spawn("c", 25, 2), spawn("f", 16, 40)], { x: 0, z: 0 }, { 16: 1 }, out)).toBeNull();
    // a disguised Ditto goes by what it looks like
    expect(gadgetTarget([spawn("g", 132, 3, { looks: { dex: 16, name: "Pidgey" } })], { x: 0, z: 0 }, { 16: 1 }, out)?.id).toBe("g");
  });

  it("says how it went when you close the card", () => {
    expect(gadgetReport([], 0)).toBeNull();
    expect(gadgetReport(["Pidgey", "Rattata", "Zubat"], 1)).toBe("While you were reading: caught Pidgey, Rattata and Zubat, 1 got away");
    expect(gadgetReport(["Growlithe", "Pidgey", "Zubat", "Pidgey"], 0)).toBe("While you were reading: caught Growlithe, 2 Pidgey and Zubat");
    expect(gadgetReport([], 2)).toBe("While you were reading: 2 got away");
  });
});
