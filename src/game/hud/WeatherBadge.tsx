"use client";

import { useState } from "react";
import { BOOSTS } from "../species";
import { useWeather, type Weather, WEATHER_LABEL } from "../weather";

/** GO's weather icon: a round white button with a slate line glyph, under the map. Tap it for what it is. */
const GLYPH: Record<Weather, React.ReactNode> = {
  clear: (
    <>
      <circle cx="16" cy="16" r="5.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="16" y1="5" x2="16" y2="7.5" transform={`rotate(${a} 16 16)`} />
      ))}
    </>
  ),
  partly: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M11 24h12a4 4 0 0 0 0-8 6 6 0 0 0-11.4 1.6A3.3 3.3 0 0 0 11 24z" fill="#ffffff" />
    </>
  ),
  cloudy: <path d="M9 23h15a4.5 4.5 0 0 0 0-9 7 7 0 0 0-13.4 2A3.6 3.6 0 0 0 9 23z" />,
  rain: (
    <>
      <path d="M9 18h15a4.5 4.5 0 0 0 0-9 7 7 0 0 0-13.4 2A3.6 3.6 0 0 0 9 18z" />
      <line x1="12" y1="22" x2="11" y2="26" />
      <line x1="17" y1="22" x2="16" y2="26" />
      <line x1="22" y1="22" x2="21" y2="26" />
    </>
  ),
  snow: (
    <>
      {[0, 60, 120].map((a) => (
        <line key={a} x1="16" y1="6" x2="16" y2="26" transform={`rotate(${a} 16 16)`} />
      ))}
    </>
  ),
  fog: (
    <>
      <line x1="7" y1="12" x2="25" y2="12" />
      <line x1="5" y1="17" x2="23" y2="17" />
      <line x1="9" y1="22" x2="27" y2="22" />
    </>
  ),
  windy: (
    <>
      <path d="M5 13h14a3 3 0 1 0-3-3" />
      <path d="M5 19h18a3 3 0 1 1-3 3" />
    </>
  ),
};

/** The weather's glyph on its own (the catch screen shows it by a boosted Pokémon's CP). */
export function WeatherIcon({ weather, size = 26 }: { weather: Weather; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="#3a5560" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {GLYPH[weather]}
    </svg>
  );
}

const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0]);

export function WeatherBadge() {
  const weather = useWeather();
  const [open, setOpen] = useState(false);
  const label = `${WEATHER_LABEL[weather]} in Boston`;
  const boosts = `Boosts ${list(BOOSTS[weather].map(cap))} Pokémon`;
  return (
    <div className="flex items-center justify-end gap-2">
      {open ? (
        <span className="panel rounded-2xl px-3 py-1.5 text-sm">
          <span className="block font-semibold">{label}</span>
          <span className="block text-xs text-ink-soft">{boosts}</span>
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Weather: ${label}. ${boosts}.`}
        className="panel grid size-11 place-items-center rounded-full transition hover:scale-105 active:scale-95"
      >
        <WeatherIcon weather={weather} />
      </button>
    </div>
  );
}
