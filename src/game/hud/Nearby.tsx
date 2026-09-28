"use client";

import { useEffect, useRef, useState } from "react";
import { eggs, gyms, type MapObject, raids, spawns, stops } from "@/content";
import { slots, START } from "../base";
import { describe } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { ObjectIcon } from "./icons";

const TABS = [
  { id: "gym", label: "Gyms", hint: "Jobs", items: gyms },
  { id: "stop", label: "PokéStops", hint: "Projects", items: stops },
  { id: "raid", label: "Raids", hint: "Hackathons", items: raids },
  { id: "spawn", label: "Wild", hint: "Fun facts", items: spawns },
  { id: "egg", label: "Eggs", hint: "In progress", items: eggs },
] as const;
type TabId = (typeof TABS)[number]["id"];

const everything: MapObject[] = TABS.flatMap((t) => [...t.items]);

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
        className="flex items-center gap-1.5 rounded-2xl bg-surface/92 px-2.5 py-1.5 text-ink shadow-lg backdrop-blur transition hover:scale-[1.03] active:scale-95 sm:px-3 sm:py-2"
      >
        <span className="flex items-end gap-0.5">
          {closest.map((o) => (
            <span key={o.slug} className="grid size-7 place-items-center sm:size-9">
              <ObjectIcon object={o} size={26} />
            </span>
          ))}
        </span>
        <span className="hidden font-display text-sm font-semibold sm:inline">Nearby</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearby-title"
          className="fixed inset-x-0 bottom-0 z-40 flex max-h-[80dvh] flex-col rounded-t-3xl bg-surface text-ink shadow-2xl sm:inset-y-4 sm:right-4 sm:left-auto sm:max-h-none sm:w-[420px] sm:rounded-3xl"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 id="nearby-title" className="font-display text-2xl font-semibold">
              Nearby
            </h2>
            <button
              ref={close}
              type="button"
              onClick={() => {
                setOpen(false);
                button.current?.focus();
              }}
              aria-label="Close Nearby"
              className="grid size-10 place-items-center rounded-full bg-ink/8 text-xl leading-none transition hover:bg-ink/15"
            >
              ×
            </button>
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
                  tab === t.id ? "bg-mystic-500 text-white shadow" : "bg-ink/6 text-ink-soft hover:bg-ink/12"
                }`}
              >
                {t.label} <span className="opacity-70">{t.items.length}</span>
              </button>
            ))}
          </div>
          <p className="px-5 pb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">{current.hint}</p>

          <ul role="tabpanel" aria-label={current.label} className="flex-1 overflow-y-auto px-3 pb-4">
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
