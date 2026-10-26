"use client";

import { useEffect } from "react";
import { halloween } from "../events";
import { playTheme, stopMusic } from "../music";
import { usePhase } from "../useTimeOfDay";

/** The map's music, by the time of day: the day loop, the night one, Halloween's waltz after dark. */
export function Music() {
  const phase = usePhase();
  useEffect(() => {
    playTheme(phase === "night" ? (halloween() ? "halloween" : "night") : "day");
  }, [phase]);
  useEffect(() => () => stopMusic(), []);
  return null;
}
