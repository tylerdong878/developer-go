"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { trainer } from "@/content";
import { Portrait } from "./hud/Portrait";
import { readyStore } from "./ready";
import { game } from "./state";
import { unlockSound } from "./sound";

// three.js needs the browser, so the game loads on the client after the page
// shell paints, under the start screen.
const Game = dynamic(() => import("./Game"), { ssr: false });

/**
 * A start screen like a game's: my name and badge while the world loads,
 * then "Tap to start". Links straight to a card (like /#aws) skip it.
 */
function Start({ onStart }: { onStart: () => void }) {
  const ready = useSyncExternalStore(readyStore.subscribe, readyStore.get, readyStore.server);
  const [shown, setShown] = useState(0);

  // An honest-ish bar: creeps up while loading, fills when the world is drawn.
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => setShown((s) => s + (0.9 - s) * 0.08), 120);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, onStart]);

  return (
    <div className="start-screen absolute inset-0 z-[70] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="grid size-28 place-items-center overflow-hidden rounded-full bg-white shadow-xl ring-8 ring-mystic-500/80">
        <Portrait size={104} />
      </div>
      <div>
        <h2 className="font-display text-4xl font-semibold text-white drop-shadow">{trainer.name}</h2>
        <p className="mt-1 font-semibold text-white/90 drop-shadow">
          Level {trainer.go.level} · Team Mystic · my portfolio, Pokémon GO style
        </p>
      </div>
      {ready ? (
        <button
          type="button"
          autoFocus
          onClick={onStart}
          className="start-pulse rounded-full bg-white px-10 py-4 font-display text-xl font-semibold text-mystic-900 shadow-2xl"
        >
          Tap to start
        </button>
      ) : (
        <div className="w-56" role="progressbar" aria-label="Loading the base" aria-valuenow={Math.round(shown * 100)}>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${shown * 100}%` }} />
          </div>
          <p className="mt-2 text-sm font-semibold text-white/90">Loading the base...</p>
        </div>
      )}
      <p className="absolute bottom-6 max-w-md text-xs text-white/75">
        WASD or tap to walk · drag to look around · the Poké Ball is the menu
      </p>
    </div>
  );
}

export function GameLoader() {
  const [started, setStarted] = useState(false);
  const skip = useSyncExternalStore(
    () => () => {},
    () => window.location.hash.length > 1,
    () => false,
  );
  useEffect(() => {
    game.input.locked = !(started || skip);
  }, [started, skip]);
  const start = () => {
    unlockSound();
    setStarted(true);
  };
  return (
    <>
      <Game />
      {started || skip ? null : <Start onStart={start} />}
    </>
  );
}
