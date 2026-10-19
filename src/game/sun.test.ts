import { describe, expect, it } from "vitest";
import { phaseAt, sunDirection, sunNow } from "./sun";

const at = (h: number, m = 0, month = 5) => new Date(2026, month, 21, h, m);

describe("the sun from the visitor's clock", () => {
  it("rises in the morning and sets in the evening", () => {
    const { sunrise, sunset } = sunNow(at(12));
    expect(sunrise).toBeGreaterThan(3 * 60);
    expect(sunrise).toBeLessThan(8 * 60);
    expect(sunset).toBeGreaterThan(16 * 60);
    expect(sunset).toBeLessThan(22 * 60);
  });

  it("has longer days in June than in December", () => {
    const june = sunNow(at(12, 0, 5));
    const dec = sunNow(at(12, 0, 11));
    expect(june.sunset - june.sunrise).toBeGreaterThan(dec.sunset - dec.sunrise + 120);
  });

  it("goes through the four phases over a day", () => {
    expect(phaseAt(at(2))).toBe("night");
    expect(phaseAt(at(13))).toBe("day");
    const { sunrise, sunset } = sunNow(at(12));
    const minutes = (t: number) => at(Math.floor(t / 60), Math.round(t % 60));
    expect(phaseAt(minutes(sunrise + 30))).toBe("morning");
    expect(phaseAt(minutes(sunset - 20))).toBe("dusk");
    expect(phaseAt(minutes(sunset + 120))).toBe("night");
  });

  it("shines from the east in the morning, the south at noon, the west in the evening", () => {
    const { sunrise, sunset } = sunNow(at(12));
    const minutes = (t: number) => at(Math.floor(t / 60), Math.round(t % 60));
    expect(sunDirection(minutes(sunrise + 60))[0]).toBeGreaterThan(0.3);
    expect(sunDirection(minutes(sunset - 60))[0]).toBeLessThan(-0.3);
    const noon = sunDirection(minutes((sunrise + sunset) / 2));
    expect(Math.abs(noon[0])).toBeLessThan(0.2);
    expect(noon[2]).toBeGreaterThan(0);
    for (const d of [noon, sunDirection(at(3))]) expect(Math.hypot(...d)).toBeCloseTo(1, 5);
  });
});
