"use client";

import { useEffect, useState } from "react";
import { spawns, wild } from "@/content";
import { type Feed, type FeedCatch, fetchFeed, fetchTotals, type Totals } from "../community";
import { Sheet } from "./Sheet";

const n = (v: number) => v.toLocaleString("en-US");
const NAMES = new Map<number, string>([...wild.map((w) => [w.dex, w.name] as const), ...spawns.map((s) => [s.pokemon.dex, s.pokemon.name] as const)]);
const nameOf = (dex: number) => NAMES.get(dex) ?? `No. ${dex}`;

function ago(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Sprite({ dex, size = 40 }: { dex: number; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
    <img src={`/sprites/${dex}.webp`} alt="" width={size} height={size} className="object-contain" style={{ width: size, height: size }} />
  );
}

/** Everyone's numbers and catches, refreshed every few seconds while it's open. */
function useCommunity() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () => {
      fetchTotals().then((t) => live && t && setTotals(t));
      fetchFeed().then((f) => live && f && setFeed(f));
      setNow(Date.now());
    };
    load();
    const id = setInterval(load, 8000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);
  return { totals, feed, now };
}

function Strongest({ c }: { c: FeedCatch }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gold/20 px-4 py-3">
      <Sprite dex={c.dex} size={56} />
      <div>
        <p className="text-xs font-bold tracking-wide text-gold-ink">Strongest catch so far</p>
        <p className="font-display text-lg font-semibold">
          {nameOf(c.dex)}, CP {n(c.cp)}
        </p>
      </div>
    </div>
  );
}

/**
 * The base is shared: every visitor's catches, spins, and visits add up
 * here, with a live feed of what people just caught.
 */
export function CommunityPanel({ onClose }: { onClose: () => void }) {
  const { totals, feed, now } = useCommunity();
  const tiles = totals
    ? ([
        ["Trainers", totals.trainers],
        ["Pokémon caught", totals.catches],
        ["Stops spun", totals.spins],
        ["Places visited", totals.visits],
      ] as const)
    : null;
  const top = feed?.species[0]?.count ?? 1;

  return (
    <Sheet title="Community" subtitle="Everyone who's played the base, together" onClose={onClose}>
      {tiles ? (
        <dl className="grid grid-cols-2 gap-2">
          {tiles.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-teal/15 px-4 py-3">
              <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{n(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="py-6 text-center text-ink-soft">Loading everyone&apos;s numbers...</p>
      )}

      {feed?.best ? (
        <div className="mt-4">
          <Strongest c={feed.best} />
        </div>
      ) : null}

      {feed?.recent.length ? (
        <section>
          <h3 className="mt-7 mb-2 text-xs font-bold tracking-wider text-ink-soft uppercase">Just caught</h3>
          <ul className="divide-y divide-ink/6">
            {feed.recent.map((c) => (
              <li key={`${c.at}-${c.dex}`} className="flex items-center gap-3 py-2">
                <Sprite dex={c.dex} />
                <span className="flex-1 font-semibold">
                  {nameOf(c.dex)} <span className="font-normal text-ink-soft">CP {c.cp}</span>
                </span>
                <span className="text-xs font-semibold text-ink-soft">{ago(c.at, now)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {feed?.species.length ? (
        <section>
          <h3 className="mt-7 mb-2.5 text-xs font-bold tracking-wider text-ink-soft uppercase">Most caught</h3>
          <ul className="space-y-2">
            {feed.species.map((s) => (
              <li key={s.dex} className="flex items-center gap-3">
                <Sprite dex={s.dex} size={32} />
                <span className="w-24 truncate text-sm font-semibold">{nameOf(s.dex)}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/8">
                  <span className="block h-full rounded-full bg-[#66ecb3]" style={{ width: `${(s.count / top) * 100}%` }} />
                </span>
                <span className="w-10 text-right text-sm font-semibold tabular-nums">{n(s.count)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-6 text-sm text-ink-soft">Anonymous: nobody&apos;s name is stored, just what got caught.</p>
    </Sheet>
  );
}
