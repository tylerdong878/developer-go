"use client";

import { type PointerEvent, useRef, useState, useSyncExternalStore } from "react";
import { addItems, gainXp, type Items, progressStore, recordSpin } from "../progress";
import { count } from "../community";
import { sfx } from "../sound";
import { StopIcon } from "./icons";

export const ITEM_INFO = {
  ball: { name: "Poké Ball", color: "#e3350d" },
  great: { name: "Great Ball", color: "#2b6fd6" },
  razz: { name: "Razz Berry", color: "#e0457b" },
} as const;

/** Like GO, a stop refills a few minutes after you spin it. */
const COOLDOWN = 3 * 60 * 1000;
const lastSpin = new Map<string, number>();

/** What a spin drops: a few Poké Balls, sometimes Great Balls and berries. Lures double it. */
function loot(lured: boolean): Partial<Items> {
  const k = lured ? 2 : 1;
  const found: Partial<Items> = { ball: (3 + Math.floor(Math.random() * 3)) * k };
  if (Math.random() < 0.35) found.great = (1 + Math.floor(Math.random() * 2)) * k;
  if (Math.random() < 0.3) found.razz = k;
  return found;
}

/**
 * GO's PokéStop disc: swipe it (or tap Spin) and it whirls, items pop out,
 * and the stop turns purple on the map. You can spin each stop once per visit
 * for XP; after that the disc just spins for fun.
 */
export function SpinDisc({ slug, lured }: { slug: string; lured: boolean }) {
  const { spun } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const done = spun.includes(slug);
  const [turns, setTurns] = useState(0);
  const [items, setItems] = useState<Partial<Items> | null>(null);
  const [cooling, setCooling] = useState(false);
  const from = useRef<number | null>(null);

  const spin = () => {
    sfx.spin();
    setTurns((t) => t + 1);
    const now = performance.now();
    if (now - (lastSpin.get(slug) ?? -Infinity) < COOLDOWN) {
      setCooling(true);
      return;
    }
    lastSpin.set(slug, now);
    const found = loot(lured);
    addItems(found);
    count("spins");
    setItems(found);
    if (!done) {
      recordSpin(slug);
      gainXp(50, "spun a stop");
    }
  };
  const down = (e: PointerEvent) => (from.current = e.clientX);
  const up = (e: PointerEvent) => {
    if (from.current !== null && Math.abs(e.clientX - from.current) > 30) spin();
    from.current = null;
  };

  const ring = done ? "#a46bf5" : lured ? "#f472b6" : "#1ab6e8";
  return (
    <div className="relative flex flex-col items-center gap-3 py-2">
      <div
        onPointerDown={down}
        onPointerUp={up}
        className="relative grid size-36 cursor-grab touch-pan-y place-items-center rounded-full shadow-md select-none"
        style={{
          background: `conic-gradient(from 0deg, ${ring}, #ffffff, ${ring}, #ffffff, ${ring})`,
          rotate: `${turns * 1080}deg`,
          transition: "rotate 1.1s cubic-bezier(0.2, 0.8, 0.3, 1)",
        }}
      >
        <div className="grid size-28 place-items-center rounded-full bg-surface">
          <StopIcon size={30} lured={lured} />
        </div>
      </div>
      {items ? (
        <ul className="flex gap-2" aria-label="Items">
          {(Object.entries(items) as [keyof typeof ITEM_INFO, number][]).map(([id, count]) => (
            <li
              key={id}
              className="item-pop flex items-center gap-1.5 rounded-full bg-ink/6 px-3 py-1.5 text-xs font-bold text-ink"
            >
              <span className="size-3 rounded-full" style={{ background: ITEM_INFO[id].color }} />
              {ITEM_INFO[id].name} ×{count}
            </li>
          ))}
        </ul>
      ) : cooling ? (
        <p className="text-sm font-semibold text-ink-soft">Try again in a few minutes. This stop is refilling.</p>
      ) : (
        <button type="button" onClick={spin} className="rounded-full bg-mystic-500 px-5 py-2 font-display font-semibold text-white transition hover:brightness-110 active:scale-95">
          Spin the disc
        </button>
      )}
    </div>
  );
}
