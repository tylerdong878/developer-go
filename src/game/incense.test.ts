import { describe, expect, it } from "vitest";
import { adventureReady, type Progress } from "./progress";

describe("the Daily Adventure Incense", () => {
  const at = Date.UTC(2026, 9, 28, 16);
  const p = (over: Partial<Progress>) => ({ incenseUntil: null, adventureOn: null, ...over }) as Progress;
  it("is free once a Boston day, and not while an Incense burns", () => {
    expect(adventureReady(p({}), at)).toBe(true);
    expect(adventureReady(p({ adventureOn: "2026-10-28" }), at)).toBe(false);
    expect(adventureReady(p({ adventureOn: "2026-10-27" }), at)).toBe(true);
    expect(adventureReady(p({ incenseUntil: at + 60_000 }), at)).toBe(false);
  });
});
