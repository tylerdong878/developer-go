"use client";

import { useEffect, useSyncExternalStore } from "react";
import { bySlug, describe } from "../objects";
import { focusStore, interact } from "../focus";
import { findWild } from "../wild";
import { ObjectIcon } from "./icons";

const coarse = () => window.matchMedia("(pointer: coarse)").matches;
const never = () => () => {};

/** What to call the thing in reach, and what opening it does. */
function label(goal: string) {
  const w = findWild(goal);
  if (w) return { verb: "Catch", name: w.species.name, icon: <WildIcon dex={w.species.dex} /> };
  if (goal === "place:center") return { verb: "Enter", name: "the Pokémon Center", icon: <BallIcon top="#e3342f" /> };
  if (goal === "place:mart") return { verb: "Enter", name: "the Poké Mart", icon: <BallIcon top="#2f6fd6" /> };
  const o = bySlug.get(goal);
  if (!o) return null;
  const verb = o.kind === "spawn" ? "Catch" : o.kind === "stop" ? "Spin" : o.kind === "egg" ? "Check" : "Visit";
  return { verb, name: describe(o).name, icon: <ObjectIcon object={o} size={26} /> };
}

function BallIcon({ top }: { top: string }) {
  return (
    <svg viewBox="0 0 40 40" width="26" height="26" aria-hidden>
      <circle cx="20" cy="20" r="16" fill="#fff" stroke="#1c1c24" strokeWidth="2.5" />
      <path d="M4 20a16 16 0 0 1 32 0Z" fill={top} stroke="#1c1c24" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="4.5" fill="#fff" stroke="#1c1c24" strokeWidth="2.5" />
    </svg>
  );
}

function WildIcon({ dex }: { dex: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- tiny local sprite
  return <img src={`/sprites/${dex}.webp`} alt="" width={28} height={28} className="size-7 object-contain" />;
}

/**
 * The prompt for whatever is in reach, above the Poké Ball: "E Visit AWS".
 * Press E (or Enter), or tap it, to open it. Walk away and it slides off.
 */
export function Prompt({ hidden }: { hidden: boolean }) {
  const goal = useSyncExternalStore(focusStore.subscribe, focusStore.get, focusStore.server);
  const touch = useSyncExternalStore(never, coarse, () => false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hidden || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, button, a")) return;
      if (e.code === "KeyE" || e.code === "Enter") {
        e.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  const what = goal ? label(goal) : null;
  if (hidden || !goal || !what) return null;
  return (
    <button
      key={goal}
      type="button"
      onClick={interact}
      className="panel toast-in pointer-events-auto flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 font-display font-semibold transition active:scale-95"
    >
      <span className="grid size-9 place-items-center rounded-full bg-ink/5">{what.icon}</span>
      {touch ? null : (
        <kbd className="grid size-6 place-items-center rounded-md border border-ink/20 bg-surface text-xs font-bold text-ink-soft shadow-[0_2px_0_rgb(10_42_74/0.15)]">
          E
        </kbd>
      )}
      <span>
        {what.verb} <span className="text-mystic-500">{what.name}</span>
      </span>
    </button>
  );
}
