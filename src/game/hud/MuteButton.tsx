"use client";

import { useSyncExternalStore } from "react";
import { muteStore, setMuted } from "../sound";

/** Sound on or off, right on the map (it's also in Settings), like GO's quick toggle. */
export function MuteButton() {
  const muted = useSyncExternalStore(muteStore.subscribe, muteStore.get, muteStore.server);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? "Sound is off. Turn it on" : "Sound is on. Turn it off"}
      className="panel grid size-11 place-items-center rounded-full transition hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="#3a5560" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 13h4l6-5v16l-6-5H6Z" fill="#3a5560" />
        {muted ? (
          <path d="M21 12l6 8M27 12l-6 8" />
        ) : (
          <>
            <path d="M20.5 12.5a5 5 0 0 1 0 7" />
            <path d="M23.5 9.5a9.5 9.5 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
