import { describe, expect, it } from "vitest";
import { gyms } from ".";
import { badgeTier, monthsAt, tenure } from "./badges";

const gym = (slug: string) => gyms.find((g) => g.slug === slug)!;

describe("gym badges", () => {
  it("counts the first and last month, across roles", () => {
    expect(monthsAt(gym("aws"))).toBe(3);
    expect(monthsAt(gym("khoury"))).toBe(7);
  });

  it("levels up with time at the job", () => {
    expect(badgeTier(gym("aws"))).toBe("bronze");
    expect(badgeTier(gym("khoury"))).toBe("silver");
    expect(badgeTier(gym("homegoods"))).toBe("gold");
  });

  it("runs an ongoing role to now", () => {
    const now = { ...gym("aws"), roles: [{ ...gym("aws").roles[0], start: "2026-01" as const, end: null }] };
    expect(monthsAt(now, new Date(2026, 2, 15))).toBe(3);
  });

  it("says how long in words", () => {
    expect(tenure(1)).toBe("1 month");
    expect(tenure(7)).toBe("7 months");
    expect(tenure(37)).toBe("3 years");
  });
});
