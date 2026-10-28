"use client";

import { useEffect, useSyncExternalStore } from "react";
import { count } from "../community";
import { catchChance } from "../cp";
import { GADGET, gadgetReport, gadgetTarget } from "../gadget";
import { fieldEvent, gainXp, levelFor, progressStore, recordCatch, spendItem, toast } from "../progress";
import { catchCandy, catchDust } from "../power";
import { sfx } from "../sound";
import { game } from "../state";
import { weatherStore } from "../weather";
import { endWild, isOut, wildStore } from "../wild";
import { rollSpawn } from "../wildRoll";

/* The gadget's switch, kept for the next visit (on unless you turn it off). */
const KEY = "developer-go:gadget";
let on: boolean | null = null;
const listeners = new Set<() => void>();
const read = () => {
  if (on === null)
    try {
      on = localStorage.getItem(KEY) !== "0";
    } catch {
      on = true;
    }
  return on;
};
const gadgetStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: read,
  server: () => false,
};
function setGadget(next: boolean) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

/** Throws this visit, for GO's cap. */
let thrown = 0;
const levelNow = () => levelFor(progressStore.get().xp);

/**
 * While you read a card, the gadget throws a Poké Ball every few seconds at
 * the nearest Pokémon you've caught before; close the card and it says how it went.
 */
export function useExplorerGadget(reading: boolean) {
  const enabled = useSyncExternalStore(gadgetStore.subscribe, gadgetStore.get, gadgetStore.server);
  const level = useSyncExternalStore(progressStore.subscribe, levelNow, () => 1);
  const live = reading && enabled && level >= GADGET.level;
  useEffect(() => {
    if (!live) return;
    const caught: string[] = [];
    let fled = 0;
    const id = window.setInterval(() => {
      const p = progressStore.get();
      if (thrown >= GADGET.perVisit || p.items.ball <= 0) return;
      const w = gadgetTarget(wildStore.get(), game.player.trainer.position, p.caught, (s) => isOut(s));
      if (!w || !spendItem("ball")) return;
      thrown++;
      const dex = w.species.dex;
      const r = rollSpawn(w, levelFor(p.xp), weatherStore.get());
      if (Math.random() < catchChance(dex, 1)) {
        endWild(w.id, "caught");
        recordCatch({ dex, name: w.species.name, cp: r.cp, throw: null, shiny: r.shiny, level: r.stats.level, iv: r.stats.iv }, catchDust(dex, !!r.boost), catchCandy(dex));
        fieldEvent({ kind: "catch", dex, throw: null, curve: false, boosted: !!r.boost });
        count("catches", { dex, cp: r.cp });
        gainXp(100, `gadget caught ${w.species.name}`);
        caught.push(w.species.name);
      } else {
        endWild(w.id, "fled");
        fled++;
      }
    }, GADGET.every);
    return () => {
      window.clearInterval(id);
      const report = gadgetReport(caught, fled);
      if (report) toast(report, 4500);
    };
  }, [live]);
}

/** Its icon on the map, from level 2: tap to turn it on or off. */
export function GadgetButton() {
  const enabled = useSyncExternalStore(gadgetStore.subscribe, gadgetStore.get, gadgetStore.server);
  const level = useSyncExternalStore(progressStore.subscribe, levelNow, () => 1);
  if (level < GADGET.level) return null;
  return (
    <button
      type="button"
      onClick={() => {
        sfx.tap();
        setGadget(!enabled);
        toast(enabled ? "Explorer Gadget off" : "Explorer Gadget on: while you read a card, it throws Poké Balls at ones you've caught before", enabled ? 1800 : 4000);
      }}
      aria-pressed={enabled}
      aria-label={enabled ? "Explorer Gadget is on. Turn it off" : "Explorer Gadget is off. Turn it on"}
      className="panel grid size-11 place-items-center rounded-full transition hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        {/* our own little gadget: a rounded case, a dial, a light that's lit while it's on */}
        <rect x="6" y="5" width="20" height="22" rx="7" fill={enabled ? "#2f8fd8" : "#9aa9b2"} />
        <circle cx="16" cy="18" r="5.5" fill="#fff" />
        <path d="M10.5 18h11" stroke={enabled ? "#2f8fd8" : "#9aa9b2"} strokeWidth="1.8" />
        <circle cx="16" cy="18" r="2" fill="#fff" stroke={enabled ? "#2f8fd8" : "#9aa9b2"} strokeWidth="1.6" />
        <circle cx="16" cy="9.5" r="1.8" fill={enabled ? "#9ff0a8" : "#d5dde2"} />
      </svg>
    </button>
  );
}
