"use client";

import { useSyncExternalStore } from "react";
import type { TimeOfDay } from "./palette";
import { type Phase, phaseAt } from "./sun";

export type { Phase } from "./sun";

// The layout script and the day/night toggle set data-time on <html>; the 3D
// scene follows it, so there's one switch for the whole site.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
  return () => observer.disconnect();
}

const read = (): TimeOfDay => (document.documentElement.dataset.time === "night" ? "night" : "day");

export function useTimeOfDay(): TimeOfDay {
  return useSyncExternalStore(subscribe, read, () => "day");
}

/** What the visitor picked in Settings, if anything: day, night, or (null) follow their clock. */
function forced(): TimeOfDay | null {
  try {
    const t = localStorage.getItem("time");
    return t === "day" || t === "night" ? t : null;
  } catch {
    return null;
  }
}

/** The visitor's clock, or a time from the URL (`?t=19:40`) to preview any part of the day. */
export function clockNow() {
  const now = new Date();
  const t = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("t");
  const m = t?.match(/^(\d{1,2}):(\d{2})$/);
  if (m) now.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return now;
}

/** True when the sky follows the visitor's clock (they haven't forced day or night). */
export const followingClock = () => forced() === null;

let phase: Phase = "day";
const listeners = new Set<() => void>();
let timer: number | null = null;

function update() {
  const pick = forced();
  const next: Phase = pick ?? phaseAt(clockNow());
  // the site's CSS and the HUD only know day and night: it's night once the sun is down
  const time = next === "night" ? "night" : "day";
  if (document.documentElement.dataset.time !== time) document.documentElement.dataset.time = time;
  if (next === phase) return;
  phase = next;
  listeners.forEach((l) => l());
}

const phaseStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    update();
    timer ??= window.setInterval(update, 30_000);
    return () => {
      listeners.delete(listener);
      if (!listeners.size && timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
  },
  get: () => phase,
  server: (): Phase => "day",
};

/**
 * Morning, day, dusk or night, from the visitor's own sunrise and sunset
 * (src/game/sun.ts), like GO; or day or night if they picked one in Settings.
 */
export function usePhase(): Phase {
  return useSyncExternalStore(phaseStore.subscribe, phaseStore.get, phaseStore.server);
}

/** Flip the whole site between day and night, and remember the choice. */
export function setTimeOfDay(next: TimeOfDay) {
  try {
    localStorage.setItem("time", next);
  } catch {
    // Private mode: the switch still works, it just won't be remembered.
  }
  document.documentElement.dataset.time = next;
  update();
}

/** Go back to following the visitor's clock. */
export function followClock() {
  try {
    localStorage.removeItem("time");
  } catch {
    // nothing stored
  }
  update();
}
