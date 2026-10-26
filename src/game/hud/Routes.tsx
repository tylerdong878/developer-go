"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { media } from "@/content";
import { bySlug, describe } from "../objects";
import { completeRoute, levelFor, progressStore } from "../progress";
import { atEnd, badgeFor, followRoute, quitRoute, type Route, ROUTE_LEVEL, routeById, routeKm, routeMinutes, ROUTES, routeStore, routeTick } from "../routes";
import { sfx } from "../sound";
import { game } from "../state";
import { goTo } from "../travel";
import { ItemIcon } from "./icons";
import { Sheet } from "./Sheet";

const nameOf = (slug: string) => {
  const o = bySlug.get(slug);
  return o ? describe(o).name : slug;
};

/** GO's route badge: a highway shield with the start's photo in it, a band across the top, a rim for the tier. */
export function RouteBadge({ route, runs = 0, size = 52 }: { route: Route; runs?: number; size?: number }) {
  const photo = media[route.stops[0]]?.disc;
  const { rim } = badgeFor(runs);
  const id = `shield-${route.id}`;
  return (
    <svg viewBox="0 0 40 46" width={size} height={size * 1.15} aria-hidden>
      <defs>
        <clipPath id={id}>
          <path d="M5 8c3-1 5-3 7-5 3 1 6 2 8 2s5-1 8-2c2 2 4 4 7 5v14c0 10-7 17-15 21C12 39 5 32 5 22Z" />
        </clipPath>
      </defs>
      <path d="M3 7c3-1 6-3 8-6 3 1 6 2 9 2s6-1 9-2c2 3 5 5 8 6v15c0 11-8 19-17 23C11 41 3 33 3 22Z" fill={rim} />
      <g clipPath={`url(#${id})`}>
        <rect width="40" height="46" fill="#24828b" />
        {photo ? <image href={photo} x="2" y="5" width="36" height="40" preserveAspectRatio="xMidYMid slice" /> : null}
        <rect width="40" height="12" fill="#0474f4" />
      </g>
    </svg>
  );
}

/** The ROUTES tab in Nearby: Tyler's routes, each with a FOLLOW pill (from level 7, like GO). */
export function RouteList({ onFollow }: { onFollow: () => void }) {
  const { xp, routes } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const following = useSyncExternalStore(routeStore.subscribe, routeStore.get, routeStore.server);
  const open = levelFor(xp) >= ROUTE_LEVEL;
  return (
    <>
      {open ? null : <li className="mx-1 mb-2 rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink-soft">Reach level {ROUTE_LEVEL} to follow Routes, like GO.</li>}
      {ROUTES.map((r) => (
        <li key={r.id} className="mx-1 mb-2 rounded-2xl bg-surface p-3 shadow-[0_2px_10px_rgba(48,85,93,0.12)]">
          <div className="flex items-start gap-3">
            <RouteBadge route={r} runs={routes[r.id] ?? 0} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-black text-[#406068]">{r.name}</p>
              <p className="text-xs text-ink-soft">by Tyler · {r.stops.length} stops</p>
              <p className="mt-0.5 text-xs font-bold text-[#3f9f88]">
                {routeKm(r).toFixed(1)} km · about {routeMinutes(r)} min
              </p>
              <p className="mt-1.5 text-sm leading-snug">{r.blurb}</p>
              <p className="mt-1 text-xs text-ink-soft">{r.tags.join(" ")}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={!open || following?.id === r.id}
            onClick={() => {
              sfx.open();
              followRoute(r.id);
              onFollow();
              // like GO, walk to the start
              goTo(r.stops[0]);
            }}
            className="go-pill mt-3 w-full rounded-full py-2.5 text-sm"
          >
            {following?.id === r.id ? "Following" : "Follow"}
          </button>
        </li>
      ))}
    </>
  );
}

/** The bar over the map while you follow a route: where you're up to, and a tap walks you to the next stop. */
export function RouteBar() {
  const following = useSyncExternalStore(routeStore.subscribe, routeStore.get, routeStore.server);
  useEffect(() => {
    if (!following) return;
    const id = window.setInterval(() => {
      const { x, z } = game.player.trainer.position;
      routeTick(x, z);
    }, 400);
    return () => window.clearInterval(id);
  }, [following]);
  if (!following) return null;
  const r = routeById(following.id);
  const done = atEnd(following);
  const next = r.stops[following.next];
  return (
    <button
      type="button"
      onClick={() => {
        if (done) return;
        sfx.tap();
        goTo(next);
      }}
      className="panel pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-2 text-left"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="go-title text-[0.7rem]">{r.name}</span>
        <span className="text-xs font-bold text-ink-soft tabular-nums">
          {Math.min(following.next, r.stops.length)} / {r.stops.length}
        </span>
      </span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-ink/10">
        <span className="block h-full rounded-full bg-[#2ccda9] transition-[width]" style={{ width: `${(following.next / r.stops.length) * 100}%` }} />
      </span>
      <span className="mt-1 block truncate text-xs text-ink-soft">{done ? "You made it! Tap the route button to complete it." : `Next: ${nameOf(next)}. Tap to walk there.`}</span>
    </button>
  );
}

/** GO's route button over the binoculars: opens the route, orange once you've reached the end. */
export function RouteButton() {
  const following = useSyncExternalStore(routeStore.subscribe, routeStore.get, routeStore.server);
  const [open, setOpen] = useState(false);
  if (!following && !open) return null;
  const done = atEnd(following);
  return (
    <>
      {following ? (
        <button
          type="button"
          onClick={() => {
            sfx.open();
            setOpen(true);
          }}
          aria-label={done ? "Route: complete it" : "Route"}
          className={`panel grid size-14 place-items-center rounded-full transition hover:scale-[1.04] active:scale-95 ${done ? "bg-[#f89800]!" : ""}`}
        >
          <RouteBadge route={routeById(following.id)} size={30} />
        </button>
      ) : null}
      {open ? <RoutePanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function RoutePanel({ onClose }: { onClose: () => void }) {
  const following = useSyncExternalStore(routeStore.subscribe, routeStore.get, routeStore.server);
  const { routes } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [result, setResult] = useState<{ route: Route; xp: number; items: ReturnType<typeof completeRoute>["items"] } | null>(null);
  const [quitting, setQuitting] = useState(false);
  if (result) {
    const runs = routes[result.route.id] ?? 1;
    const item = Object.entries(result.items)[0] as ["ball" | "great" | "razz", number] | undefined;
    return (
      <Sheet title="Route complete!" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <div className="item-pop">
            <RouteBadge route={result.route} runs={runs} size={96} />
          </div>
          <p className="mt-2 font-display text-xl font-black">{result.route.name}</p>
          <p className="text-sm text-ink-soft">
            {badgeFor(runs).tier} badge · {runs} run{runs === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex items-center gap-6 rounded-3xl bg-ink/5 px-6 py-3">
            <span className="font-display text-lg font-black text-mystic-500">+{result.xp.toLocaleString()} XP</span>
            {item ? (
              <span className="flex items-center gap-1.5 font-bold">
                <ItemIcon id={item[0]} size={30} />×{item[1]}
              </span>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="go-pill mt-5 rounded-full px-12 py-3 text-sm">
            OK
          </button>
        </div>
      </Sheet>
    );
  }
  if (!following) return null;
  const r = routeById(following.id);
  const done = atEnd(following);
  return (
    <Sheet title={r.name} onClose={onClose}>
      <div className="flex items-center gap-3">
        <RouteBadge route={r} runs={routes[r.id] ?? 0} size={56} />
        <p className="text-sm leading-snug">{r.blurb}</p>
      </div>
      <ol className="mt-4 space-y-1.5">
        {r.stops.map((s, i) => (
          <li key={s} className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 ${i < following.next ? "bg-[#e9f8ee]" : "bg-ink/5"}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-black ${i < following.next ? "bg-[#2ccda9] text-white" : "bg-ink/10 text-ink-soft"}`}>{i < following.next ? "✓" : i + 1}</span>
            <span className="truncate text-sm font-semibold">{nameOf(s)}</span>
          </li>
        ))}
      </ol>
      {done ? (
        <button
          type="button"
          onClick={() => {
            sfx.route();
            setResult({ route: r, ...completeRoute(r.id) });
            quitRoute();
          }}
          className="go-pill mt-5 w-full rounded-full py-3 text-sm"
        >
          Complete route
        </button>
      ) : null}
      <div className="mt-4 text-center">
        {quitting ? (
          <span className="flex justify-center gap-3">
            <button type="button" onClick={() => setQuitting(false)} className="rounded-full bg-ink/8 px-5 py-2 text-sm font-bold">
              Keep going
            </button>
            <button
              type="button"
              onClick={() => {
                quitRoute();
                onClose();
              }}
              className="rounded-full bg-[#d8463c] px-5 py-2 text-sm font-bold text-white"
            >
              Quit route
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setQuitting(true)} className="text-sm font-semibold text-ink-soft underline">
            Quit route
          </button>
        )}
      </div>
    </Sheet>
  );
}
