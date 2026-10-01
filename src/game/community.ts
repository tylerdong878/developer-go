"use client";

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/**
 * Everyone's totals, shared across visitors through the Convex backend.
 * Play is counted locally and sent in small batches every few seconds.
 * Without NEXT_PUBLIC_CONVEX_URL (or if the backend is down) this quietly
 * does nothing and the game plays the same.
 */
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
export const communityOn = !!url;

type Kind = "catches" | "spins" | "visits";
let client: ConvexHttpClient | null = null;
const pending: Record<Kind, number> = { catches: 0, spins: 0, visits: 0 };
let caught: { dex: number; cp: number }[] = [];
let timer: number | null = null;

/** A random id per browser, so the backend can rate-limit without knowing who anyone is. */
function trainerId() {
  const KEY = "developer-go:trainer";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return (trainerFallback ??= crypto.randomUUID());
  }
}
let trainerFallback: string | null = null;

const connect = () => (client ??= url ? new ConvexHttpClient(url) : null);

async function flush() {
  timer = null;
  const c = connect();
  if (!c) return;
  const batch = { ...pending, caught };
  if (!batch.catches && !batch.spins && !batch.visits) return;
  pending.catches = pending.spins = pending.visits = 0;
  caught = [];
  try {
    await c.mutation(api.community.report, { trainer: trainerId(), ...batch });
  } catch {
    // Offline or backend down: these few counts are lost, and that's fine.
  }
}

/** Counts one catch, spin, or visit toward everyone's totals. A catch also goes in the live feed. */
export function count(kind: Kind, catch_?: { dex: number; cp: number }) {
  if (!communityOn) return;
  pending[kind] += 1;
  if (catch_) caught.push(catch_);
  timer ??= window.setTimeout(flush, 5000);
}

export type Totals = { catches: number; spins: number; visits: number; trainers: number };

export type FeedCatch = { dex: number; cp: number; at: number };
export type Feed = { recent: FeedCatch[]; best: FeedCatch | null; species: { dex: number; count: number }[] };

export async function fetchFeed(): Promise<Feed | null> {
  const c = connect();
  if (!c) return null;
  try {
    return await c.query(api.community.feed, {});
  } catch {
    return null;
  }
}

export async function fetchTotals(): Promise<Totals | null> {
  const c = connect();
  if (!c) return null;
  try {
    return (await c.query(api.community.totals, {})) as Totals;
  } catch {
    return null;
  }
}
