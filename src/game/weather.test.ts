import { describe, expect, it } from "vitest";
import { fromWmo, seededWeather } from "./weather";

describe("weather", () => {
  it("maps Open-Meteo's codes to GO's weathers", () => {
    expect(fromWmo(0)).toBe("clear");
    expect(fromWmo(2)).toBe("partly");
    expect(fromWmo(3)).toBe("cloudy");
    expect(fromWmo(45)).toBe("fog");
    expect(fromWmo(61)).toBe("rain");
    expect(fromWmo(81)).toBe("rain");
    expect(fromWmo(95)).toBe("rain");
    expect(fromWmo(73)).toBe("snow");
    expect(fromWmo(1, 40)).toBe("windy");
    // rain beats wind
    expect(fromWmo(63, 40)).toBe("rain");
  });

  it("gives everyone the same weather in the same hour, and never snow in summer", () => {
    const a = new Date(2026, 6, 4, 15, 5);
    const b = new Date(2026, 6, 4, 15, 55);
    expect(seededWeather(a)).toBe(seededWeather(b));
    for (let h = 0; h < 24 * 60; h++) expect(seededWeather(new Date(2026, 6, 1, h))).not.toBe("snow");
  });

  it("is mostly fair", () => {
    const counts: Record<string, number> = {};
    for (let h = 0; h < 5000; h++) {
      const w = seededWeather(new Date(2026, 0, 1, h));
      counts[w] = (counts[w] ?? 0) + 1;
    }
    expect((counts.clear ?? 0) + (counts.partly ?? 0)).toBeGreaterThan(2500);
    expect(counts.rain ?? 0).toBeGreaterThan(100);
  });
});
