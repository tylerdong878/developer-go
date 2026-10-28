"use client";

import { useEffect, useSyncExternalStore } from "react";
import { bySlug, describe } from "../objects";
import { focusStore, interact } from "../focus";
import { findWild } from "../wild";
import { ObjectIcon } from "./icons";

const coarse = () => window.matchMedia("(pointer: coarse)").matches;
const never = () => () => {};

/** What to call the thing in reach, and what opening it does. */
/** Halloween's spooky surprise box, small. */
function SurpriseIcon() {
  return (
    <svg viewBox="0 0 32 32" width={26} height={26} aria-hidden>
      <rect x="5" y="13" width="22" height="15" rx="2.5" fill="#f07a18" />
      <rect x="3.5" y="9" width="25" height="6" rx="2" fill="#7a3fc0" />
      <rect x="14" y="9" width="4" height="19" fill="#7a3fc0" />
      <path d="M16 9c-3-5-9-4-7-1 1 1.5 4 1.5 7 1Zm0 0c3-5 9-4 7-1-1 1.5-4 1.5-7 1Z" fill="#9a5ee0" />
      <path d="m8.5 18 2.5-2 2.5 2Zm10 0 2.5-2 2.5 2ZM9 23h5l2 1.5 2-1.5h5" fill="#3a1a08" stroke="#3a1a08" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function label(goal: string) {
  const w = findWild(goal);
  if (w?.surprise) return { verb: "Open", name: "spooky surprise", icon: <SurpriseIcon /> };
  // Gen 1's Route 12 (pret Route12.asm): "A sleeping Pokémon blocks the way!", and the flute wakes it
  if (w?.fact === "snorlax") return { note: "A sleeping Pokémon blocks the way!", verb: "Play the", name: "Poké Flute", icon: <WildIcon dex={143} /> };
  if (w) return { verb: "Catch", name: w.looks?.name ?? w.species.name, icon: <WildIcon dex={w.looks?.dex ?? w.species.dex} /> };
  if (goal === "place:center") return { verb: "Enter", name: "the Pokémon Center", icon: <BallIcon top="#e3342f" /> };
  if (goal === "place:mart") return { verb: "Enter", name: "the Poké Mart", icon: <BallIcon top="#2f6fd6" /> };
  if (goal === "place:lab") return { verb: "Enter", name: "Northeastern's lab", icon: <BallIcon top="#c8323a" /> };
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
  return <img src={`/portraits/${dex}.webp`} alt="" width={28} height={28} className="size-7 object-contain" />;
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
      <span className="text-left leading-tight">
        {"note" in what ? <span className="block text-[11px] font-bold text-ink-soft">{what.note}</span> : null}
        {what.verb} <span className="text-mystic-500">{what.name}</span>
      </span>
    </button>
  );
}
