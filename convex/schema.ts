import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Community totals for the base: one row per counter (catches, spins,
 * visits, trainers), plus one row per anonymous trainer so each browser
 * can be rate-limited and capped.
 */
export default defineSchema({
  totals: defineTable({ key: v.string(), value: v.number() }).index("by_key", ["key"]),
  trainers: defineTable({
    browser: v.string(),
    day: v.string(),
    today: v.number(),
    last: v.number(),
  }).index("by_browser", ["browser"]),
});
