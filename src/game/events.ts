/*
 * GO's event calendar, the parts this town takes part in (notes/research/go-round-3.md
 * 1 and 7). Times are Boston's, like GO's local times for a trainer here, so
 * Halloween starts Tuesday Oct 27 at 10 am and the clocks going back on Nov 1
 * are in the UTC times below.
 */

export type GoEvent = { id: string; name: string; from: number; to: number; blurb: string };

export const EVENTS: GoEvent[] = [
  {
    id: "city-safari-boston",
    name: "City Safari: Boston",
    // 10 am to 6 pm both days; GO's rescheduled safari, after the nor'easter
    from: Date.UTC(2026, 9, 24, 14),
    to: Date.UTC(2026, 9, 25, 22),
    blurb: "GO's Boston safari is on this weekend, 10 am to 6 pm, with Eevee in an explorer hat. This whole town is Boston too.",
  },
  {
    id: "halloween-1",
    name: "Halloween 2026: Part I",
    from: Date.UTC(2026, 9, 27, 14),
    to: Date.UTC(2026, 10, 1, 15),
    blurb: "PokéStops turn orange with pumpkins round them, leaves fall, and Zubat and Gastly are out a lot more.",
  },
  {
    id: "halloween-2",
    name: "Halloween 2026: Part II",
    from: Date.UTC(2026, 10, 1, 15),
    to: Date.UTC(2026, 10, 6, 1),
    blurb: "The orange stops and pumpkins stay, and Gastly takes over the night.",
  },
];

export const activeEvents = (at: number) => EVENTS.filter((e) => at >= e.from && at < e.to);

/** A peek at Halloween before it starts: ?event=halloween (Part I) or ?event=halloween2 in the address. */
const preview = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("event");

/** Which part of Halloween is on at a moment: 0 (none), 1 or 2. */
export function halloweenPart(at: number): 0 | 1 | 2 {
  if (preview === "halloween") return 1;
  if (preview === "halloween2") return 2;
  const on = activeEvents(at).find((e) => e.id.startsWith("halloween"));
  return on ? (on.id === "halloween-2" ? 2 : 1) : 0;
}

/** Whether the map is dressed for Halloween this visit (decided once, when the page opens). */
let dressed: boolean | null = null;
export const halloween = () => (dressed ??= halloweenPart(Date.now()) > 0);
export const upcomingEvents = (at: number) => EVENTS.filter((e) => at < e.from).sort((a, b) => a.from - b.from);

/** "Oct 27, 10 AM" in Boston time. */
export const whenIs = (at: number) => new Date(at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric" });
