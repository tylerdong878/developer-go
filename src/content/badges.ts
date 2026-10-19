import type { Gym, Month } from "./types";

/** GO's gym badge tiers. */
export type BadgeTier = "basic" | "bronze" | "silver" | "gold";

const index = (m: Month) => {
  const [y, mm] = m.split("-").map(Number);
  return y * 12 + mm - 1;
};

/** Months at a job, counting its first and last month, across all its roles (an ongoing one runs to now). */
export function monthsAt(gym: Gym, now = new Date()) {
  const today = now.getFullYear() * 12 + now.getMonth();
  return gym.roles.reduce((n, r) => n + (r.end ? index(r.end) : today) - index(r.start) + 1, 0);
}

/**
 * A job gym's badge (notes/research/gfx-go-gyms-stops.md 3.6). GO's badges
 * level up as you battle and spin there; ours level up with time at the job:
 * Basic under 3 months, Bronze from 3, Silver from 6, Gold from a year.
 */
export function badgeTier(gym: Gym, now?: Date): BadgeTier {
  const m = monthsAt(gym, now);
  return m >= 12 ? "gold" : m >= 6 ? "silver" : m >= 3 ? "bronze" : "basic";
}

/** "7 months", "3 years". */
export function tenure(months: number) {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}
