import { slots } from "./base";
import { KM_PER_UNIT } from "./bond";
import { WALK_SPEED } from "./state";

/*
 * GO's Routes (notes/research/go-round-3.md 5), as guided walks through
 * Tyler's best work: follow one from Nearby (from level 7, like GO), walk
 * stop to stop along the dotted line, and once you've reached the end the
 * route button turns orange and you tap COMPLETE ROUTE. GO's rewards: 4,000 XP
 * for the first route of the day, 2,000 after, and an item. Badges go plain,
 * bronze, silver and gold at 1, 5, 20 and 100 runs.
 */

export type Route = { id: string; name: string; blurb: string; tags: string[]; stops: string[] };

export const ROUTES: Route[] = [
  {
    id: "best-of-tyler",
    name: "Best of Tyler",
    blurb: "The short tour: AWS, the trading builds, the hackathon win, and this site.",
    tags: ["#highlights", "#quant", "#hackathons"],
    stops: ["aws", "matching-engine", "imc-prosperity-4", "bostonhacks-2024", "developer-go"],
  },
  {
    id: "quant-row",
    name: "Quant Row",
    blurb: "The market data and trading projects by the harbor, one after another.",
    tags: ["#quant", "#data"],
    stops: ["etf-pipeline", "ofi-regime-study", "matching-engine", "imc-prosperity-4"],
  },
];

export const ROUTE_LEVEL = 7;
/** How close counts as reaching a stop on the route. */
export const REACHED = 7;

export const routeById = (id: string) => ROUTES.find((r) => r.id === id)!;

/** The route's length in base units. */
export function routeLength(r: Route) {
  let d = 0;
  for (let i = 1; i < r.stops.length; i++) {
    const [ax, az] = slots[r.stops[i - 1]];
    const [bx, bz] = slots[r.stops[i]];
    d += Math.hypot(bx - ax, bz - az);
  }
  return d;
}
/** In GO km, and about how many minutes at a walk (GO shows both). */
export const routeKm = (r: Route) => routeLength(r) * KM_PER_UNIT;
export const routeMinutes = (r: Route) => Math.max(1, Math.round(routeLength(r) / WALK_SPEED / 60));

/** GO's route badge tiers: plain, then bronze, silver and gold. */
export function badgeFor(runs: number) {
  return runs >= 100 ? { tier: "Gold", rim: "#e2b04a" } : runs >= 20 ? { tier: "Silver", rim: "#b8c4cc" } : runs >= 5 ? { tier: "Bronze", rim: "#c98a4b" } : { tier: runs ? "Plain" : "Not yet", rim: "#d6dee2" };
}


/* ---------------- the route you're on ---------------- */

/** The route being followed, and which of its stops is next (its length once you've reached the end). */
export type Following = { id: string; next: number };
let following: Following | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const routeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => following,
  server: () => null,
};

export function followRoute(id: string) {
  following = { id, next: 0 };
  notify();
}
export function quitRoute() {
  following = null;
  notify();
}
/** Called a few times a second with where the trainer is: reaching the next stop moves you on. */
export function routeTick(x: number, z: number) {
  if (!following) return;
  const r = routeById(following.id);
  if (following.next >= r.stops.length) return;
  const [sx, sz] = slots[r.stops[following.next]];
  if (Math.hypot(sx - x, sz - z) > REACHED) return;
  following = { ...following, next: following.next + 1 };
  notify();
}
export const atEnd = (f: Following | null) => !!f && f.next >= routeById(f.id).stops.length;
