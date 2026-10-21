import { describe, expect, it } from "vitest";
import { hasShiny, portrait, rollShiny } from "./shiny";

describe("shinies", () => {
  it("only rolls for species with a shiny in GO", () => {
    expect(hasShiny(25)).toBe(true);
    expect(hasShiny(869)).toBe(false); // Alcremie isn't in GO
    expect(rollShiny(869, 1, 0)).toBe(false);
    expect(rollShiny(25, 1 / 64, 0.001)).toBe(true);
    expect(rollShiny(25, 1 / 64, 0.5)).toBe(false);
  });

  it("shows the shiny portrait only when there is one", () => {
    expect(portrait(25, true)).toBe("/portraits/25-shiny.webp");
    expect(portrait(869, true)).toBe("/portraits/869.webp");
  });
});
