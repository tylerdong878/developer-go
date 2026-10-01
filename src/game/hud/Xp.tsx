"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Spawn } from "@/content";
import { popStore } from "../progress";
import { CloseButton } from "./Sheet";

/** How long a fact stays up before it slides away. */
const FACT_MS = 9000;

/** "+100 XP" toasts that drop in from the top and fade. */
export function XpPops() {
  const pops = useSyncExternalStore(popStore.subscribe, popStore.get, popStore.server);
  return (
    <div aria-live="polite" className="flex flex-col items-center gap-1.5">
      {pops.map((p) => (
        <p key={p.id} className="panel xp-pop rounded-full px-4 py-1.5 font-display text-base font-bold text-mystic-500">
          +{p.amount} XP <span className="font-semibold text-ink-soft">{p.why}</span>
        </p>
      ))}
    </div>
  );
}

/** A caught fact Pokémon drops its fact in from the top, with a bar that runs down until it goes. */
export function FactToast({ spawn, onDone }: { spawn: Spawn; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, FACT_MS);
    return () => window.clearTimeout(id);
  }, [onDone]);
  return (
    <div role="status" className="panel toast-in pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl">
      <div className="flex items-start gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
        <img src={`/sprites/${spawn.pokemon.dex}.webp`} alt="" width={52} height={52} className="size-13 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-[#c48a12]">Caught {spawn.pokemon.name}</p>
          <p className="font-display text-lg leading-tight font-semibold">{spawn.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{spawn.body}</p>
        </div>
        <CloseButton label="Close fact" onClick={onDone} />
      </div>
      <span className="toast-timer absolute bottom-0 left-0 h-0.5 w-full bg-gold" style={{ animationDuration: `${FACT_MS}ms` }} />
    </div>
  );
}
