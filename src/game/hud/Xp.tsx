"use client";

import { useSyncExternalStore } from "react";
import { levelFor, popStore, progressStore, xpForLevel } from "../progress";

/** Your visit's level and XP, in a chip at the top, with GO's teal bar. */
export function XpBar() {
  const { xp } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const level = levelFor(xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const share = Math.min(1, (xp - from) / (to - from));
  return (
    <div className="rounded-full bg-surface/90 px-3.5 py-1.5 text-ink shadow-md backdrop-blur" title="Your visit">
      <div className="flex items-baseline gap-2 text-xs font-semibold">
        <span className="font-display text-sm">You, Lv {level}</span>
        <span className="text-ink-soft tabular-nums">{xp.toLocaleString("en-US")} XP</span>
      </div>
      <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-teal transition-[width] duration-500" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  );
}

/** "+100 XP" popups that float up and fade. */
export function XpPops() {
  const pops = useSyncExternalStore(popStore.subscribe, popStore.get, popStore.server);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[30%] z-[60] flex flex-col items-center gap-1">
      {pops.map((p) => (
        <p key={p.id} className="xp-pop font-display text-2xl font-bold text-white drop-shadow-[0_2px_3px_rgba(10,42,74,0.6)]">
          +{p.amount} XP <span className="text-base font-semibold opacity-90">{p.why}</span>
        </p>
      ))}
    </div>
  );
}
