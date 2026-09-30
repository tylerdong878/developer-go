"use client";

import { useSyncExternalStore } from "react";
import { popStore } from "../progress";

/** "+100 XP" popups that float up and fade. */
export function XpPops() {
  const pops = useSyncExternalStore(popStore.subscribe, popStore.get, popStore.server);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[30%] z-[60] flex flex-col items-center gap-1">
      {pops.map((p) => (
        <p key={p.id} className="xp-pop rounded-full bg-mystic-900/80 px-4 py-1 font-display text-xl font-bold text-white shadow-lg">
          +{p.amount} XP <span className="text-base font-semibold opacity-90">{p.why}</span>
        </p>
      ))}
    </div>
  );
}
