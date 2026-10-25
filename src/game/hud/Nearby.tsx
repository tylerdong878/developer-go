"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { eggs, gyms, type MapObject, media, raids, stops } from "@/content";
import { slots, START } from "../base";
import { describe } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { goalId, isOut, wildStore } from "../wild";
import { ObjectIcon } from "./icons";
import { RouteList } from "./Routes";
import { ROUTES } from "../routes";

const TABS = [
  { id: "gym", label: "Gyms", hint: "Jobs", items: gyms },
  { id: "stop", label: "PokéStops", hint: "Projects", items: stops },
  { id: "raid", label: "Raids", hint: "Hackathons", items: raids },
  { id: "spawn", label: "Wild", hint: "Pokémon near you", items: [] },
  { id: "egg", label: "Eggs", hint: "In progress", items: eggs },
  { id: "route", label: "Routes", hint: "Tyler's walks", items: [] },
] as const;
type TabId = (typeof TABS)[number]["id"];

const everything: MapObject[] = TABS.flatMap((t) => [...t.items]);

const noWild: never[] = [];

function distanceFrom([x, z]: readonly [number, number], o: MapObject) {
  const [ox, oz] = slots[o.slug];
  return Math.hypot(ox - x, oz - z);
}

function formatDistance(d: number) {
  return d < 1000 ? `${Math.max(1, Math.round(d / 5) * 5)} m` : `${(d / 1000).toFixed(1)} km`;
}

/** Where the trainer is, sampled a few times a second so lists stay current without re-rendering every frame. */
function useTrainerSpot() {
  const [spot, setSpot] = useState<readonly [number, number]>(START);
  useEffect(() => {
    const id = setInterval(() => {
      const { x, z } = game.player.trainer.position;
      setSpot((s) => (Math.hypot(s[0] - x, s[1] - z) > 1 ? [x, z] : s));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return spot;
}

/**
 * GO's Nearby: a button in the corner showing the closest few things, and a
 * sheet listing everything by kind. Picking one dashes the trainer there,
 * so nobody has to walk across the base to read about a job.
 */
export function Nearby({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [tab, setTab] = useState<TabId>("gym");
  const spot = useTrainerSpot();
  const button = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const closest = [...everything].sort((a, b) => distanceFrom(spot, a) - distanceFrom(spot, b)).slice(0, 3);
  const current = TABS.find((t) => t.id === tab)!;
  const wildNow = useSyncExternalStore(wildStore.subscribe, wildStore.get, () => noWild);
  // only the ones out on the map: not still rustling, not on their way off, and not lured (GO leaves those out too)
  // like GO's Nearby: what's out near you, not lured ones or your Daily Encounter
  const wildOut = wildNow.filter((w) => isOut(w) && !w.lured && !w.daily);
  const wildList = [...wildOut].sort(
    (a, b) => Math.hypot(a.x - spot[0], a.z - spot[1]) - Math.hypot(b.x - spot[0], b.z - spot[1]),
  );
  // like GO, the ones you haven't found yet come first
  const list = [...current.items].sort((a, b) => distanceFrom(spot, a) - distanceFrom(spot, b));

  const pick = (slug: string) => {
    setOpen(false);
    button.current?.focus();
    goTo(slug, true);
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="Nearby"
        className="panel flex h-14 items-center gap-0.5 rounded-full px-3 transition hover:scale-[1.03] active:scale-95"
      >
        <span className="flex items-end gap-0.5">
          {closest.map((o, i) => (
            <span key={o.slug} className={`grid size-8 place-items-center ${i === 2 ? "max-sm:hidden" : ""}`}>
              <ObjectIcon object={o} size={24} />
            </span>
          ))}
        </span>
        <span className="ml-1 font-display text-xs font-bold tracking-wide text-ink-soft uppercase">Nearby</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearby-title"
          className="go-sheet sheet-in fixed inset-0 z-40 flex flex-col sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[430px] sm:rounded-[28px]"
        >
          <div className="px-6 pt-7 pb-3 text-center">
            <h2 id="nearby-title" className="go-title text-[0.95rem]">
              Nearby
            </h2>
          </div>

          <div className="overflow-x-auto px-3 pb-3">
            <div role="tablist" aria-label="What's nearby" className="mx-auto flex w-max gap-0.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`go-title shrink-0 border-b-2 px-2 pt-1 pb-1.5 text-[0.66rem] transition sm:px-2.5 sm:text-[0.7rem] ${
                    tab === t.id ? "border-[#30555d] text-ink" : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {t.label}{" "}
                  <span className="opacity-70">{t.items.length + (t.id === "spawn" ? wildOut.length : t.id === "route" ? ROUTES.length : 0)}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="go-title px-5 pb-2 text-center text-[0.62rem] text-ink-soft">{current.hint}</p>

          <ul role="tabpanel" aria-label={current.label} className="flex-1 overflow-y-auto px-3 pb-28">
            {tab === "route" ? (
              <RouteList
                onFollow={() => {
                  setOpen(false);
                  button.current?.focus();
                }}
              />
            ) : null}
            {tab === "spawn" && wildList.length ? (
              <>
                <li className="px-2 pt-1 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase">Wild right now</li>
                {wildList.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => pick(goalId(w))}
                      className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-ink/6 focus-visible:bg-ink/6"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky">
                        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
                        <img src={`/portraits/${w.species.dex}.webp`} alt="" width={38} height={38} className="object-contain" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{w.species.name}</span>
                        <span className="block truncate text-sm text-ink-soft">Wild, go catch it</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-ink-soft tabular-nums">
                        {formatDistance(Math.hypot(w.x - spot[0], w.z - spot[1]))}
                      </span>
                    </button>
                  </li>
                ))}
              </>
            ) : null}
            {list.map((o) => {
              const { name, subtitle } = describe(o);
              return (
                <li key={o.slug}>
                  <button
                    type="button"
                    onClick={() => pick(o.slug)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-ink/6 focus-visible:bg-ink/6"
                  >
                    {media[o.slug] ? (
                      <span className="relative size-12 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- small local webp */}
                        <img src={media[o.slug].disc} alt="" width={48} height={48} loading="lazy" className="size-12 rounded-full object-cover ring-2 ring-[#5ad2c8]" />
                        <span className="absolute -right-1.5 -bottom-1 grid size-6 place-items-center rounded-full bg-surface shadow">
                          <ObjectIcon object={o} size={18} />
                        </span>
                      </span>
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky">
                        <ObjectIcon object={o} size={38} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{name}</span>
                      <span className="block truncate text-sm text-ink-soft">{subtitle}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-ink-soft tabular-nums">
                      {formatDistance(distanceFrom(spot, o))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-[#e9f8e6] via-[#e9f8e6]/80 to-transparent pt-8 pb-5">
            <button
              ref={close}
              type="button"
              aria-label="Close Nearby"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
              className="go-close pointer-events-auto grid size-14 place-items-center rounded-full transition active:scale-90"
            >
              <svg viewBox="0 0 16 16" className="size-[45%]" aria-hidden>
                <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
