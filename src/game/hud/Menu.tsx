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

/** GO's Poké Ball menu button. While the menu's open it's the mint X that closes it. */
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
        <span className="go-menu-button grid size-14 place-items-center rounded-full text-[#24828b]">
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

/** GO's menu icons: one-color teal line drawings. */
const line = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICON = {
  pokedex: (
    <svg viewBox="0 0 40 40" className="size-[46%]" aria-hidden>
      <rect x="9" y="5" width="22" height="30" rx="4" {...line} />
      <circle cx="20" cy="15" r="5" {...line} />
      <path d="M14 26h12M14 30h7" {...line} />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 40 40" className="size-[48%]" aria-hidden>
      <circle cx="14" cy="15" r="5" {...line} />
      <path d="M5 32c1-6 4.6-9 9-9s8 3 9 9" {...line} />
      <circle cx="27" cy="13" r="4.5" {...line} />
      <path d="M24.5 22.4c1-.3 1.6-.4 2.5-.4 4.4 0 8 3 9 9" {...line} />
    </svg>
  ),
  about: (
    <svg viewBox="0 0 40 40" className="size-[50%]" aria-hidden>
      <rect x="4" y="9" width="32" height="23" rx="4" {...line} />
      <circle cx="14" cy="18" r="4" {...line} />
      <path d="M8.5 27.5c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5M23 16h8M23 21h6" {...line} />
    </svg>
  ),
  pokemon: (
    <svg viewBox="0 0 40 40" className="size-[54%]" aria-hidden>
      {/* a little round head with two tall pointed ears */}
      <path d="M11 17 8 4l9 9M29 17l3-13-9 9" {...line} />
      <circle cx="20" cy="23" r="11" {...line} />
      <circle cx="15.5" cy="21.5" r="1.4" fill="currentColor" />
      <circle cx="24.5" cy="21.5" r="1.4" fill="currentColor" />
      <path d="M17.5 27c1.5 1.3 3.5 1.3 5 0" {...line} />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 40 40" className="size-[50%]" aria-hidden>
      <path d="M14 11V9a6 6 0 0 1 12 0v2" {...line} />
      <rect x="7" y="11" width="26" height="24" rx="7" {...line} />
      <path d="M7 20h26M17 20v4h6v-4" {...line} />
    </svg>
  ),
} as const;

type Item = { id: Screen; label: string; icon: ReactNode; x: number; y: number };

/**
 * GO's main menu layout (notes/research/pokemon-go-ui.md): five buttons in
 * an X, labels above them. Pokédex and Community where GO has Pokédex and
 * Battle, About Tyler in the middle where GO keeps its Shop, and Pokémon and
 * Items along the bottom. Positions are shares of the screen.
 */
const QUINCUNX: Item[] = [
  { id: "pokedex", label: "Pokédex", icon: ICON.pokedex, x: 22, y: 59 },
  ...(communityOn ? [{ id: "community" as const, label: "Community", icon: ICON.community, x: 78, y: 59 }] : []),
  { id: "about", label: "About Tyler", icon: ICON.about, x: 50, y: 72 },
  { id: "pokemon", label: "Pokémon", icon: ICON.pokemon, x: 22, y: 85 },
  { id: "bag", label: "Items", icon: ICON.bag, x: 78, y: 85 },
];

/** The text list in the top right, like GO's Settings / Tips / News. */
const CORNER: { id: Screen; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "profile", label: "Profile" },
];

/**
 * GO's main menu: a full mint screen (a phone-width column on bigger
 * screens) with the five big round buttons in an X and a short text list
 * in the corner. The Poké Ball below turns into the X that closes it.
 */
export function MainMenu({ onPick }: { onPick: (screen: Screen) => void }) {
  return (
    <nav aria-label="Main menu" className="go-menu sheet-in relative h-full w-full sm:max-w-[430px] sm:rounded-[28px]">
      <ul className="absolute top-[7%] right-[7%] space-y-4 text-right">
        {CORNER.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c.id)} className="go-title text-[0.8rem] text-[#24828b] transition hover:brightness-75">
              {c.label}
            </button>
          </li>
        ))}
      </ul>
      {QUINCUNX.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.id)}
          className="menu-pop group absolute flex w-[30%] -translate-x-1/2 -translate-y-[62%] flex-col items-center gap-2"
          style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: `${i * 40}ms` }}
        >
          <span className="go-title text-[0.72rem] whitespace-nowrap text-[#24828b]">{item.label}</span>
          <span aria-hidden className="go-menu-button grid aspect-square w-[54%] place-items-center rounded-full text-[#24828b] transition group-hover:scale-105 group-active:scale-95">
            {item.icon}
          </span>
        </button>
      ))}
    </nav>
  );
}
