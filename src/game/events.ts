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
    blurb: "PokéStops turn orange with pumpkins round them, leaves fall, and Zubat and Duskull are out a lot more. Tap the spooky surprises in the grass.",
  },
  {
    id: "halloween-2",
    name: "Halloween 2026: Part II",
    from: Date.UTC(2026, 10, 1, 15),
    to: Date.UTC(2026, 10, 6, 1),
    blurb: "The orange stops and pumpkins stay, and Litwick and Greavard come out. Shiny Greavard is new in GO this year.",
  },
];

/*
 * GO's Spotlight Hour (notes/research/go-round-3.md 1 and 4): every Thursday
 * from 6 to 7 pm local, one species is out on nearly every spawn point. GO's
 * own picks where we know them (Gastly on Oct 29, 2026); otherwise one of the
 * town's wild ones by the week.
 */
const SPOTLIGHT_PICKS = [25, 133, 54, 52, 58, 60, 129, 74, 63, 66, 16, 19];
const GO_SPOTLIGHT: Record<string, number> = { "2026-10-29": 92 };
const HOUR = 3_600_000;

const BOSTON = typeof Intl === "undefined" ? null : new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" });

/** Boston's weekday (0 Sunday), hour and date for a moment. */
function boston(at: number) {
  const p = BOSTON?.formatToParts(at) ?? [];
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), hour: Number(get("hour")), date: `${get("year")}-${get("month")}-${get("day")}` };
}

export type Spotlight = { dex: number; from: number; to: number; date: string };

/** The last answer, by the hour: the spawn tables ask for every point, every second. */
let known: { hour: number; value: Spotlight | null } | null = null;

/** The Spotlight Hour on now, or the next one (within the week). */
export function spotlight(at: number): Spotlight | null {
  const hour = Math.floor(at / HOUR);
  if (known?.hour === hour) return known.value;
  known = { hour, value: findSpotlight(at) };
  return known.value;
}

function findSpotlight(at: number): Spotlight | null {
  // start from the top of the current hour and walk forward an hour at a time
  for (let t = Math.floor(at / HOUR) * HOUR, k = 0; k < 24 * 8; t += HOUR, k++) {
    const b = boston(t);
    if (b.day !== 4 || b.hour !== 18 || t + HOUR <= at) continue;
    const week = Math.floor(t / (7 * 24 * HOUR));
    return { dex: GO_SPOTLIGHT[b.date] ?? SPOTLIGHT_PICKS[week % SPOTLIGHT_PICKS.length], from: t, to: t + HOUR, date: b.date };
  }
  return null;
}
/** The species in the spotlight right now, if it's the hour. */
export function spotlightNow(at: number) {
  const s = spotlight(at);
  return s && at >= s.from ? s.dex : null;
}

const spotlightEvent = (s: Spotlight, name: (dex: number) => string): GoEvent => ({
  id: `spotlight-${s.date}`,
  name: `${name(s.dex)} Spotlight Hour`,
  from: s.from,
  to: s.to,
  blurb: `For an hour, ${name(s.dex)} is out on nearly every spawn point in town, like GO's Spotlight Hours every Thursday at 6 pm.`,
});

/** The calendar with this week's Spotlight Hour in it. */
export function withSpotlight(at: number, name: (dex: number) => string) {
  const s = spotlight(at);
  return s ? [...EVENTS, spotlightEvent(s, name)] : EVENTS;
}

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
