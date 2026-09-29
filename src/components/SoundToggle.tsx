"use client";

import { useSyncExternalStore } from "react";
import { muteStore, setMuted } from "@/game/sound";

/** Turns the game's sounds on and off, and remembers the choice. */
export function SoundToggle() {
  const muted = useSyncExternalStore(muteStore.subscribe, muteStore.get, muteStore.server);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? "Turn sound on" : "Mute sound"}
      className="grid size-11 place-items-center rounded-full bg-surface/85 text-ink shadow-md backdrop-blur transition hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor" />
        {muted ? (
          <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
