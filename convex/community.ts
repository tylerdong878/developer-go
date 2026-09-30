import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const COUNTERS = ["catches", "spins", "visits", "trainers"] as const;

/** Per report: nobody honestly catches more than this in a few seconds. */
const MAX_PER_REPORT = { catches: 10, spins: 10, visits: 20 };
/** Per trainer per day, so a script can't pump the numbers. */
const DAILY_CAP = 800;
/** Reports from one trainer closer together than this are dropped. */
const MIN_GAP_MS = 4000;

/** Everyone's totals, for the Profile screen. */
export const totals = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("totals").collect();
    const out: Record<string, number> = { catches: 0, spins: 0, visits: 0, trainers: 0 };
    for (const r of rows) out[r.key] = r.value;
    return out;
  },
});

/**
 * One visitor's latest batch of play. Anonymous (a random id per browser),
 * capped per report and per day, and rate-limited, so the totals stay honest.
 */
export const report = mutation({
  args: { trainer: v.string(), catches: v.number(), spins: v.number(), visits: v.number() },
  handler: async (ctx, args) => {
    if (args.trainer.length < 8 || args.trainer.length > 64) return;
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const counts = {
      catches: clamp(args.catches, MAX_PER_REPORT.catches),
      spins: clamp(args.spins, MAX_PER_REPORT.spins),
      visits: clamp(args.visits, MAX_PER_REPORT.visits),
    };

    const trainer = await ctx.db
      .query("trainers")
      .withIndex("by_browser", (q) => q.eq("browser", args.trainer))
      .unique();
    if (trainer && now - trainer.last < MIN_GAP_MS) return;
    const usedToday = trainer && trainer.day === day ? trainer.today : 0;
    let room = Math.max(0, DAILY_CAP - usedToday);
    for (const key of ["catches", "spins", "visits"] as const) {
      counts[key] = Math.min(counts[key], room);
      room -= counts[key];
    }
    const spent = DAILY_CAP - usedToday - room;
    if (trainer) await ctx.db.patch(trainer._id, { day, today: usedToday + spent, last: now });
    else await ctx.db.insert("trainers", { browser: args.trainer, day, today: spent, last: now });

    const add = { ...counts, trainers: trainer ? 0 : 1 };
    for (const key of COUNTERS) {
      if (!add[key]) continue;
      const row = await ctx.db
        .query("totals")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (row) await ctx.db.patch(row._id, { value: row.value + add[key] });
      else await ctx.db.insert("totals", { key, value: add[key] });
    }
  },
});

function clamp(n: number, max: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
}
