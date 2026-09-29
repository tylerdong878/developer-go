"use client";

import { type PointerEvent, useRef, useState, useSyncExternalStore } from "react";
import { gainXp, progressStore, recordSpin } from "../progress";
import { sfx } from "../sound";

const ITEMS = [
  { name: "Poké Ball", count: 3, color: "#e3350d" },
  { name: "Razz Berry", count: 1, color: "#e0457b" },
  { name: "Potion", count: 2, color: "#b05cd6" },
];

/**
 * GO's PokéStop disc: swipe it (or tap Spin) and it whirls, items pop out,
 * and the stop turns purple on the map. You can spin each stop once per visit
 * for XP; after that the disc just spins for fun.
 */
export function SpinDisc({ slug, name, lured }: { slug: string; name: string; lured: boolean }) {
  const { spun } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const done = spun.includes(slug);
  const [turns, setTurns] = useState(0);
  const [items, setItems] = useState(false);
  const from = useRef<number | null>(null);

  const spin = () => {
    sfx.spin();
    setTurns((t) => t + 1);
    setItems(true);
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
        className="relative grid size-40 cursor-grab touch-pan-y place-items-center rounded-full shadow-xl select-none"
        style={{
          background: `conic-gradient(from 0deg, ${ring}, #ffffff, ${ring}, #ffffff, ${ring})`,
          rotate: `${turns * 1080}deg`,
          transition: "rotate 1.1s cubic-bezier(0.2, 0.8, 0.3, 1)",
        }}
      >
        <div className="grid size-32 place-items-center rounded-full bg-surface p-3 text-center font-display text-lg leading-tight font-semibold text-ink">
          {name}
        </div>
      </div>
      {items ? (
        <ul className="flex gap-2" aria-label="Items">
          {ITEMS.map((i) => (
            <li
              key={i.name}
              className="item-pop flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-mystic-900 shadow"
            >
              <span className="size-3 rounded-full" style={{ background: i.color }} />
              {i.name} ×{i.count}
            </li>
          ))}
        </ul>
      ) : (
        <button type="button" onClick={spin} className="rounded-full bg-mystic-500 px-5 py-2 font-display font-semibold text-white shadow">
          {done ? "Spin again" : "Spin the disc"}
        </button>
      )}
    </div>
  );
}
