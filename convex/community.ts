import { v } from "convex/values";
import { type MutationCtx, mutation, query } from "./_generated/server";

export const COUNTERS = ["catches", "spins", "visits", "trainers"] as const;

/** Per report: nobody honestly catches more than this in a few seconds. */
const MAX_PER_REPORT = { catches: 10, spins: 10, visits: 20 };
/** Per trainer per day, so a script can't pump the numbers. */
const DAILY_CAP = 800;
/** Reports from one trainer closer together than this are dropped. */
const MIN_GAP_MS = 4000;

/** Real Pokémon only, at CPs the game can actually roll. */
const DEX_MAX = 1025;
const CP_MAX = 2000;

/** Everyone's totals, for the Community screen. */
export const totals = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("totals").collect();
    const out: Record<string, number> = { catches: 0, spins: 0, visits: 0, trainers: 0 };
    for (const r of rows) if (!r.key.startsWith("dex:")) out[r.key] = r.value;
    return out;
  },
});

/** The live feed: the latest catches, the strongest one ever, and the most-caught species. */
export const feed = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db.query("catches").order("desc").take(12);
    const best = await ctx.db.query("catches").withIndex("by_cp").order("desc").first();
    const species = (await ctx.db.query("totals").collect())
      .filter((r) => r.key.startsWith("dex:"))
      .map((r) => ({ dex: Number(r.key.slice(4)), count: r.value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const row = (c: { dex: number; cp: number; _creationTime: number }) => ({ dex: c.dex, cp: c.cp, at: c._creationTime });
    return { recent: recent.map(row), best: best ? row(best) : null, species };
  },
});

/**
 * One visitor's latest batch of play. Anonymous (a random id per browser),
 * capped per report and per day, and rate-limited, so the totals stay honest.
 */
export const report = mutation({
  args: {
    trainer: v.string(),
    catches: v.number(),
    spins: v.number(),
    visits: v.number(),
    caught: v.optional(v.array(v.object({ dex: v.number(), cp: v.number() }))),
  },
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

    // The catches themselves, for the feed: no more than were counted, and only real ones.
    const caught = (args.caught ?? [])
      .slice(0, counts.catches)
      .filter((c) => Number.isInteger(c.dex) && c.dex >= 1 && c.dex <= DEX_MAX && c.cp >= 10 && c.cp <= CP_MAX);
    for (const c of caught) {
      await ctx.db.insert("catches", { dex: c.dex, cp: Math.round(c.cp) });
      await bump(ctx, `dex:${c.dex}`, 1);
    }

    const add = { ...counts, trainers: trainer ? 0 : 1 };
    for (const key of COUNTERS) if (add[key]) await bump(ctx, key, add[key]);
  },
});

async function bump(ctx: MutationCtx, key: string, by: number) {
  const row = await ctx.db
    .query("totals")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (row) await ctx.db.patch(row._id, { value: row.value + by });
  else await ctx.db.insert("totals", { key, value: by });
}

function clamp(n: number, max: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
}
