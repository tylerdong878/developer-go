"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { communityOn } from "../community";
import { levelFor, progressStore, xpForLevel } from "../progress";

export type Screen = "community" | "pokemon" | "profile" | "about" | "pokedex" | "bag" | "settings";

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

/** GO's Poké Ball menu button. While the menu's open it's the white × that closes it. */
export function MenuBall({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      className="grid size-16 place-items-center rounded-full drop-shadow-md transition hover:scale-105 active:scale-95"
    >
      {open ? (
        <span className="panel grid size-14 place-items-center rounded-full text-mystic-500">
          <svg viewBox="0 0 16 16" className="size-5" aria-hidden>
            <path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
      ) : (
        <svg viewBox="0 0 64 64" className="size-full" aria-hidden>
          <circle cx="32" cy="32" r="30" fill="#fff" />
          <path d="M2 32a30 30 0 0 1 60 0Z" fill="#e3350d" />
          <circle cx="32" cy="32" r="30" fill="none" stroke="#1c1c24" strokeWidth="3" />
          <path d="M2.5 32h59" stroke="#1c1c24" strokeWidth="4" />
          <circle cx="32" cy="32" r="9.5" fill="#fff" stroke="#1c1c24" strokeWidth="4" />
          <circle cx="32" cy="32" r="4.5" fill="#f4f4f4" stroke="#1c1c24" strokeWidth="1.5" />
        </svg>
      )}
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
const MON = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="20" cy="20" r="15" fill="#fff" stroke="#1c1c24" strokeWidth="2.5" />
    <path d="M5 20a15 15 0 0 1 30 0Z" fill="#e3350d" stroke="#1c1c24" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="4.5" fill="#fff" stroke="#1c1c24" strokeWidth="2.5" />
  </svg>
);

const PEOPLE = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="14" cy="15" r="5" fill="#1ab6e8" />
    <path d="M5 30c.8-5 4.4-8 9-8s8.2 3 9 8Z" fill="#1ab6e8" />
    <circle cx="26" cy="13" r="5.5" fill="#0b84d6" />
    <path d="M16 30c.9-5.5 4.8-9 10-9s9.1 3.5 10 9Z" fill="#0b84d6" />
  </svg>
);

const GEAR = (
  <svg viewBox="0 0 40 40" width="34" height="34">
    <circle cx="20" cy="20" r="16" fill="#9aa5b4" />
    <path d="M20 10.5 22 13l3.2-.6.9 3.1 3 1.3-.9 3.2 1.8 2.7-2.6 1.9.2 3.3-3.3.3-1.5 2.9-2.8-1.6-2.8 1.6-1.5-2.9-3.3-.3.2-3.3-2.6-1.9 1.8-2.7-.9-3.2 3-1.3.9-3.1 3.2.6Z" fill="#fff" />
    <circle cx="20" cy="21" r="3.6" fill="#9aa5b4" />
  </svg>
);

type Item = { id: Screen; label: string; icon: ReactNode };

/** The small row along the top, and the two big ones beside the ball, like GO. */
const TOP: Item[] = [
  { id: "pokedex", label: "Pokédex", icon: DEX },
  ...(communityOn ? [{ id: "community" as const, label: "Community", icon: PEOPLE }] : []),
  { id: "profile", label: "Profile", icon: STAR },
  { id: "about", label: "About Tyler", icon: CARD },
  { id: "settings", label: "Settings", icon: GEAR },
];
const BIG: [Item, Item] = [
  { id: "pokemon", label: "Pokémon", icon: MON },
  { id: "bag", label: "Items", icon: BAG },
];

function MenuButton({ item, big = false, delay, onPick }: { item: Item; big?: boolean; delay: number; onPick: (s: Screen) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(item.id)}
      className={`menu-pop group flex flex-col items-center gap-1.5 ${big ? "w-24" : "w-[72px]"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        aria-hidden
        className={`panel grid place-items-center rounded-full transition group-hover:scale-105 group-active:scale-95 ${big ? "size-[76px] [&_svg]:size-11" : "size-14"}`}
      >
        {item.icon}
      </span>
      <span className={`text-center font-display font-semibold text-white ${big ? "text-base" : "text-sm"}`}>{item.label}</span>
    </button>
  );
}

/**
 * GO's main menu: a row of small buttons up top, and the two you use most,
 * Pokémon and Items, big on either side of the ball. They pop in one by one.
 */
export function MainMenu({ onPick }: { onPick: (screen: Screen) => void }) {
  return (
    <nav aria-label="Main menu" className="flex flex-col items-center gap-8 px-4 pb-3">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-4">
        {TOP.map((item, i) => (
          <MenuButton key={item.id} item={item} delay={60 + i * 35} onPick={onPick} />
        ))}
      </div>
      <div className="flex items-end gap-24">
        <MenuButton item={BIG[0]} big delay={0} onPick={onPick} />
        <MenuButton item={BIG[1]} big delay={30} onPick={onPick} />
      </div>
    </nav>
  );
}
