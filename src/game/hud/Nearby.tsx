"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { eggs, gyms, type MapObject, raids, spawns, stops } from "@/content";
import { slots, START } from "../base";
import { describe } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { goalId, wildStore } from "../wild";
import { ObjectIcon } from "./icons";
import { CloseButton } from "./Sheet";

const TABS = [
  { id: "gym", label: "Gyms", hint: "Jobs", items: gyms },
  { id: "stop", label: "PokéStops", hint: "Projects", items: stops },
  { id: "raid", label: "Raids", hint: "Hackathons", items: raids },
  { id: "spawn", label: "Wild", hint: "Fun facts", items: spawns },
  { id: "egg", label: "Eggs", hint: "In progress", items: eggs },
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
  const wildList = [...wildNow].sort(
    (a, b) => Math.hypot(a.x - spot[0], a.z - spot[1]) - Math.hypot(b.x - spot[0], b.z - spot[1]),
  );
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
          {closest.map((o) => (
            <span key={o.slug} className="grid size-8 place-items-center">
              <ObjectIcon object={o} size={24} />
            </span>
          ))}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearby-title"
          className="panel card-in fixed inset-x-0 bottom-0 z-40 flex max-h-[80dvh] flex-col rounded-t-3xl sm:inset-y-4 sm:right-4 sm:left-auto sm:max-h-none sm:w-[400px] sm:rounded-3xl"
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <h2 id="nearby-title" className="font-display text-2xl font-semibold">
              Nearby
            </h2>
            <CloseButton
              ref={close}
              label="Close Nearby"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
            />
          </div>

          <div role="tablist" aria-label="What's nearby" className="flex gap-1.5 overflow-x-auto px-4 pb-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  tab === t.id ? "bg-mystic-500 text-white" : "bg-ink/6 text-ink-soft hover:bg-ink/12"
                }`}
              >
                {t.label}{" "}
                <span className="opacity-70">{t.items.length + (t.id === "spawn" ? wildNow.length : 0)}</span>
              </button>
            ))}
          </div>
          <p className="px-5 pb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">{current.hint}</p>

          <ul role="tabpanel" aria-label={current.label} className="flex-1 overflow-y-auto px-3 pb-4">
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
                        <img src={`/sprites/${w.species.dex}.webp`} alt="" width={38} height={38} className="object-contain" />
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
                <li className="px-2 pt-3 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase">✦ Facts about me</li>
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
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky">
                      <ObjectIcon object={o} size={38} />
                    </span>
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
        </div>
      ) : null}
    </>
  );
}
