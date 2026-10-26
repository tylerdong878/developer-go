"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { musicStore, setMusic } from "../music";
import { muteStore, setMuted, setVibrate, vibrateStore } from "../sound";
import { followClock, followingClock, setTimeOfDay, usePhase, useTimeOfDay } from "../useTimeOfDay";
import { Sheet } from "./Sheet";

/** A row with a label and a switch. */
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-2xl bg-ink/5 px-4 py-3.5 text-left font-semibold transition hover:bg-ink/8"
    >
      {label}
      <span className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-[#2ccda9]" : "bg-ink/15"}`} aria-hidden>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/** GO keeps its switches out of the way, in Settings. So does the base. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const muted = useSyncExternalStore(muteStore.subscribe, muteStore.get, muteStore.server);
  const vibrate = useSyncExternalStore(vibrateStore.subscribe, vibrateStore.get, vibrateStore.server);
  const music = useSyncExternalStore(musicStore.subscribe, musicStore.get, musicStore.server);
  const time = useTimeOfDay();
  // re-read on every phase change, so the clock switch shows the right state
  usePhase();
  const clock = followingClock();
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="space-y-2">
        <Toggle label="Sound" on={!muted} onChange={(on) => setMuted(!on)} />
        <Toggle label="Music" on={music} onChange={setMusic} />
        <Toggle label="Vibration" on={vibrate} onChange={setVibrate} />
        <Toggle label="Match my clock (sunrise, dusk, night)" on={clock} onChange={(on) => (on ? followClock() : setTimeOfDay(time))} />
        <Toggle label="Night" on={time === "night"} onChange={(on) => setTimeOfDay(on ? "night" : "day")} />
      </div>
      <Link href="/text" className="mt-5 block rounded-2xl bg-ink/5 px-4 py-3.5 font-semibold transition hover:bg-ink/8">
        Read it as a plain page instead
      </Link>
      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        A fan-made portfolio. Pokémon and all respective names are trademark and © of Nintendo, Creatures Inc., and GAME
        FREAK inc. Not affiliated with The Pokémon Company, Nintendo, Niantic, or Scopely. Every building and Pokémon here
        is modeled from scratch in code.
      </p>
    </Sheet>
  );
}
