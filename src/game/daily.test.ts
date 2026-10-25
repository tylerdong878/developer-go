import { describe, expect, it } from "vitest";
import { NO_STREAK, nextStreak, STAMPS, stampWith, streakNow } from "./daily";
import { activeEvents, EVENTS, upcomingEvents } from "./events";

describe("daily streaks", () => {
  it("count days in a row, start over after day 7 or a missed day", () => {
    let s = nextStreak(NO_STREAK, "2026-10-24")!;
    expect(s.n).toBe(1);
    expect(nextStreak(s, "2026-10-24")).toBeNull();
    for (const day of ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]) s = nextStreak(s, day)!;
    expect(s.n).toBe(7);
    expect(nextStreak(s, "2026-10-31")!.n).toBe(1);
    expect(nextStreak({ day: "2026-10-24", n: 3 }, "2026-10-26")!.n).toBe(1);
    expect(streakNow({ day: "2026-10-24", n: 3 }, "2026-10-25")).toEqual({ n: 3, today: false });
    expect(streakNow({ day: "2026-10-24", n: 3 }, "2026-10-26")).toEqual({ n: 0, today: false });
  });

  it("stamp once a day, seven for a Breakthrough, the days in any order", () => {
    let stamps: string[] = [];
    stamps = stampWith(stamps, "2026-10-01")!;
    expect(stampWith(stamps, "2026-10-01")).toBeNull();
    for (const day of ["2026-10-03", "2026-10-09", "2026-10-10", "2026-10-15", "2026-10-20", "2026-10-24"]) stamps = stampWith(stamps, day)!;
    expect(stamps).toHaveLength(STAMPS);
    expect(stampWith(stamps, "2026-10-25")).toBeNull();
  });
});

describe("the event calendar", () => {
  it("starts Halloween on GO's Boston date", () => {
    const halloween = EVENTS.find((e) => e.id === "halloween-1")!;
    expect(new Date(halloween.from).toLocaleString("en-US", { timeZone: "America/New_York" })).toBe("10/27/2026, 10:00:00 AM");
    expect(activeEvents(Date.UTC(2026, 9, 28)).map((e) => e.id)).toEqual(["halloween-1"]);
    expect(upcomingEvents(Date.UTC(2026, 9, 24, 12))[0].id).toBe("city-safari-boston");
  });
});
