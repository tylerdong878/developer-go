import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Community totals for the base: one row per counter (catches, spins,
 * visits, trainers, and "dex:<n>" for each species), one row per anonymous
 * trainer so each browser can be rate-limited and capped, and the catches
 * themselves (just the species and CP) for the live feed.
 */
export default defineSchema({
  totals: defineTable({ key: v.string(), value: v.number() }).index("by_key", ["key"]),
  trainers: defineTable({
    browser: v.string(),
    day: v.string(),
    today: v.number(),
    last: v.number(),
  }).index("by_browser", ["browser"]),
  catches: defineTable({ dex: v.number(), cp: v.number() }).index("by_cp", ["cp"]),
});
