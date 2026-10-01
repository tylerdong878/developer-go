"use client";

import { useState, useSyncExternalStore } from "react";
import { spawns } from "@/content";
import { type Catch, HISTORY_MAX, progressStore, releaseCatch } from "../progress";
import { Sheet } from "./Sheet";

const SORTS = [
  ["recent", "Recent"],
  ["cp", "CP"],
  ["number", "Number"],
] as const;
type Sort = (typeof SORTS)[number][0];

const factDex = new Set(spawns.map((s) => s.pokemon.dex));
const when = (at: number) =>
  new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function sorted(list: Catch[], by: Sort) {
  if (by === "cp") return [...list].sort((a, b) => b.cp - a.cp);
  if (by === "number") return [...list].sort((a, b) => a.dex - b.dex || b.cp - a.cp);
  return list; // already newest first
}

/** One Pokémon up close, like GO's detail screen. */
function Detail({ c, onBack }: { c: Catch; onBack: () => void }) {
  return (
    <div className="card-in text-center">
      <p className="font-display text-ink-soft">
        CP <span className="text-4xl font-semibold text-ink">{c.cp}</span>
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
      <img src={`/sprites/${c.dex}.webp`} alt={c.name} width={160} height={160} className="mx-auto my-2 size-40 object-contain" />
      <p className="font-display text-2xl font-semibold">
        {factDex.has(c.dex) ? "✦ " : ""}
        {c.name}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        No. {String(c.dex).padStart(4, "0")}. Caught {when(c.at)}
        {c.throw ? ` with a ${c.throw} throw` : ""}.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={onBack} className="rounded-full bg-ink/6 px-5 py-2.5 font-display font-semibold transition hover:bg-ink/12">
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            releaseCatch(c.id);
            onBack();
          }}
          className="rounded-full bg-mystic-500 px-5 py-2.5 font-display font-semibold text-white transition hover:brightness-110"
        >
          Transfer
        </button>
      </div>
    </div>
  );
}

/** GO's Pokémon screen: everything you've caught, newest first, with its CP. */
export function PokemonPanel({ onClose }: { onClose: () => void }) {
  const { history } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const [by, setBy] = useState<Sort>("recent");
  const [open, setOpen] = useState<number | null>(null);
  const picked = history.find((c) => c.id === open);

  return (
    <Sheet title="Pokémon" subtitle={`${history.length}/${HISTORY_MAX}`} onClose={onClose}>
      {picked ? (
        <Detail c={picked} onBack={() => setOpen(null)} />
      ) : history.length ? (
        <>
          <div role="tablist" aria-label="Sort by" className="mb-4 flex gap-1.5">
            {SORTS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={by === id}
                onClick={() => setBy(id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  by === id ? "bg-mystic-500 text-white" : "bg-ink/6 text-ink-soft hover:bg-ink/12"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {sorted(history, by).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpen(c.id)}
                  className="flex w-full flex-col items-center rounded-2xl bg-ink/5 px-1 pt-2 pb-2.5 transition hover:bg-ink/10"
                >
                  <span className="font-display text-xs text-ink-soft">
                    CP <span className="text-sm font-semibold text-ink">{c.cp}</span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny local sprite */}
                  <img src={`/sprites/${c.dex}.webp`} alt="" width={64} height={64} className="size-16 object-contain" />
                  <span className="max-w-full truncate text-sm font-semibold">
                    {factDex.has(c.dex) ? "✦ " : ""}
                    {c.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-10 text-center text-ink-soft">Nothing yet. Walk up to a wild Pokémon to catch it.</p>
      )}
    </Sheet>
  );
}
