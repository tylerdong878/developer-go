import { describe, expect, it } from "vitest";
import { modeFor } from "./renderMode";

describe("render mode", () => {
  it("runs full speed on the open map", () => {
    expect(modeFor("none", false, true, false)).toBe("full");
  });

  it("stops where none of the map shows", () => {
    expect(modeFor("encounter", false, true, false)).toBe("off");
    expect(modeFor("full", false, true, false)).toBe("off");
    expect(modeFor("none", false, true, true)).toBe("off");
  });

  it("slows behind a side card, the intro, or an unfocused window", () => {
    expect(modeFor("side", false, true, false)).toBe("slow");
    expect(modeFor("none", true, true, false)).toBe("slow");
    expect(modeFor("none", false, false, false)).toBe("slow");
  });
});
