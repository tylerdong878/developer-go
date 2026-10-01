"use client";

import { useSyncExternalStore } from "react";
import type { TimeOfDay } from "./palette";

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

/** Flip the whole site between day and night, and remember the choice. */
export function setTimeOfDay(next: TimeOfDay) {
  document.documentElement.dataset.time = next;
  try {
    localStorage.setItem("time", next);
  } catch {
    // Private mode: the switch still works, it just won't be remembered.
  }
}
