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
