"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { levelFor, progressStore, xpForLevel } from "../progress";

export type Screen = "profile" | "about" | "pokedex" | "bag" | "medals" | "nearby" | "settings";

/** The trainer badge in the bottom left, like GO's: your level, ringed by how far you are to the next one. */
export function TrainerBadge({ onOpen }: { onOpen: () => void }) {
  const { xp } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const level = levelFor(xp);
  const from = xpForLevel(level);
  const share = Math.min(1, (xp - from) / (xpForLevel(level + 1) - from));
  const around = 2 * Math.PI * 25;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`You, level ${level}. Open your profile`}
      className="relative grid size-14 place-items-center transition hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r="25" fill="var(--surface)" stroke="rgb(10 42 74 / 0.12)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${share * around} ${around}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="relative font-display text-xl font-bold text-mystic-500 tabular-nums">{level}</span>
    </button>
  );
}

/** GO's Poké Ball menu button. */
export function MenuBall({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      className="grid size-16 place-items-center rounded-full drop-shadow-md transition hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden>
        <circle cx="32" cy="32" r="30" fill="#fff" />
        <path d="M2 32a30 30 0 0 1 60 0Z" fill={open ? "#9aa5b4" : "#e3350d"} />
        <circle cx="32" cy="32" r="30" fill="none" stroke="#1c1c24" strokeWidth="3" />
        <path d="M2.5 32h59" stroke="#1c1c24" strokeWidth="4" />
        <circle cx="32" cy="32" r="9.5" fill="#fff" stroke="#1c1c24" strokeWidth="4" />
        <circle cx="32" cy="32" r="4.5" fill={open ? "#9aa5b4" : "#f4f4f4"} stroke="#1c1c24" strokeWidth="1.5" />
      </svg>
    </button>
  );
}

const DEX = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <rect x="7" y="4" width="26" height="32" rx="5" fill="#e3350d" />
    <rect x="7" y="4" width="7" height="32" rx="3" fill="#b82a0a" />
    <circle cx="23" cy="15" r="6" fill="#bfe9ff" stroke="#fff" strokeWidth="2.5" />
    <rect x="17" y="26" width="12" height="3" rx="1.5" fill="#fff" opacity=".8" />
  </svg>
);
const BAG = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <path d="M14 9a6 6 0 0 1 12 0v3h-3V9a3 3 0 0 0-6 0v3h-3Z" fill="#8a5a3b" />
    <rect x="8" y="11" width="24" height="25" rx="7" fill="#e0a45a" />
    <path d="M8 19c0-4 3-8 12-8s12 4 12 8v3H8Z" fill="#c9843c" />
    <rect x="17" y="21" width="6" height="5" rx="1.5" fill="#f6c453" />
  </svg>
);
const MEDAL = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <path d="M13 3h6l3 11h-6ZM27 3h-6l-3 11h6Z" fill="#1ab6e8" />
    <circle cx="20" cy="25" r="11" fill="#f6c453" stroke="#d99a1e" strokeWidth="2.5" />
    <path d="m20 19 2 4 4.3.4-3.2 2.9 1 4.2-4.1-2.3-4.1 2.3 1-4.2-3.2-2.9 4.3-.4Z" fill="#fff6d8" />
  </svg>
);
const CARD = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <rect x="4" y="9" width="32" height="22" rx="4" fill="#0b84d6" />
    <circle cx="13" cy="19" r="4.5" fill="#fff" />
    <path d="M7.5 28c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5Z" fill="#fff" />
    <rect x="21" y="15" width="11" height="2.6" rx="1.3" fill="#fff" />
    <rect x="21" y="20" width="8" height="2.6" rx="1.3" fill="#bfe9ff" />
  </svg>
);
const STAR = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="20" cy="20" r="16" fill="#2fd3c6" />
    <path d="m20 9 3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L20 25.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1Z" fill="#fff" />
  </svg>
);
const PIN = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <ellipse cx="20" cy="35" rx="8" ry="2.5" fill="#0a2a4a" opacity=".2" />
    <path d="M20 4c6.6 0 11 4.8 11 10.6C31 22 20 34 20 34S9 22 9 14.6C9 8.8 13.4 4 20 4Z" fill="#2fd3c6" />
    <circle cx="20" cy="14.5" r="4.5" fill="#fff" />
  </svg>
);

const GEAR = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="20" cy="20" r="16" fill="#9aa5b4" />
    <path d="M20 10.5 22 13l3.2-.6.9 3.1 3 1.3-.9 3.2 1.8 2.7-2.6 1.9.2 3.3-3.3.3-1.5 2.9-2.8-1.6-2.8 1.6-1.5-2.9-3.3-.3.2-3.3-2.6-1.9 1.8-2.7-.9-3.2 3-1.3.9-3.1 3.2.6Z" fill="#fff" />
    <circle cx="20" cy="21" r="3.6" fill="#9aa5b4" />
  </svg>
);

const ITEMS: { id: Screen; label: string; hint: string; icon: ReactNode }[] = [
  { id: "profile", label: "Profile", hint: "You", icon: STAR },
  { id: "about", label: "About Tyler", hint: "Me, school, skills", icon: CARD },
  { id: "pokedex", label: "Pokédex", hint: "Catches, facts", icon: DEX },
  { id: "bag", label: "Bag", hint: "Items", icon: BAG },
  { id: "medals", label: "Medals", hint: "Yours, my awards", icon: MEDAL },
  { id: "nearby", label: "Nearby", hint: "Everything", icon: PIN },
  { id: "settings", label: "Settings", hint: "Sound, night", icon: GEAR },
];

/** GO's main menu: big round buttons fanned out above the Poké Ball. */
export function MainMenu({ onPick }: { onPick: (screen: Screen) => void }) {
  return (
    <nav aria-label="Main menu" className="card-in flex flex-wrap justify-center gap-4 px-4">
      {ITEMS.map((item) => (
        <button key={item.id} type="button" onClick={() => onPick(item.id)} className="group flex w-20 flex-col items-center gap-1.5">
          <span aria-hidden className="grid size-16 place-items-center overflow-hidden rounded-full bg-white shadow-lg transition group-hover:scale-105 group-active:scale-95">
            {item.icon}
          </span>
          <span className="rounded-full bg-surface/92 px-2.5 py-0.5 text-center text-sm font-semibold text-ink shadow backdrop-blur">
            {item.label}
          </span>
          <span className="text-[11px] font-semibold text-white drop-shadow">{item.hint}</span>
        </button>
      ))}
    </nav>
  );
}
