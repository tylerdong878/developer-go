"use client";

import { type CSSProperties, useEffect, useState, useSyncExternalStore } from "react";
import { type ItemId, type LevelUp as Up, levelUpStore, seenLevelUp } from "../progress";
import { sfx } from "../sound";
import { ItemIcon } from "./icons";

const NAMES: Record<ItemId, string> = { ball: "Poké Ball", great: "Great Ball", razz: "Razz Berry" };

/** GO's level-up: the map dims, the new level pops in a glowing badge, then what it gave you and an OK. */
export function LevelUp() {
  const up = useSyncExternalStore(levelUpStore.subscribe, levelUpStore.get, levelUpStore.server);
  return up ? <LevelUpScreen key={up.to} {...up} /> : null;
}

function LevelUpScreen({ from, to, items }: Up) {
  // a jump of a few levels at once counts up through them
  const [shown, setShown] = useState(Math.min(from + 1, to));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    sfx.levelUp();
    const timers = [window.setTimeout(() => setReady(true), 1200)];
    for (let l = from + 2; l <= to; l++) timers.push(window.setTimeout(() => setShown(l), 280 * (l - from - 1)));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [from, to]);
  const list = (Object.entries(items) as [ItemId, number][]).filter(([, n]) => n > 0);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="levelup-title" className="fixed inset-0 z-[80] grid place-items-center px-6">
      <div className="scrim-in absolute inset-0 bg-[#0a2a4a]/55 backdrop-blur-[3px]" aria-hidden />
      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        <div className="levelup-badge relative grid size-40 place-items-center rounded-full">
          {Array.from({ length: 10 }, (_, k) => (
            <span key={k} className="catch-star" style={{ "--a": `${k * 36 + 8}deg`, animationDelay: `${150 + (k % 3) * 40}ms` } as CSSProperties} aria-hidden>
              ★
            </span>
          ))}
          <span className="font-display text-7xl font-bold text-[#f07a2a] tabular-nums">{shown}</span>
        </div>
        <h2 id="levelup-title" className="go-title mt-6 text-2xl text-white drop-shadow-md">
          Level up!
        </h2>
        <p className="mt-1 text-sm font-semibold text-white/85">You reached level {to}.</p>
        {list.length ? (
          <div className="mt-5 w-full rounded-3xl bg-white/95 px-4 pt-3 pb-4 text-ink shadow-lg">
            <p className="text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">Rewards</p>
            <ul className="mt-3 flex justify-center gap-6">
              {list.map(([id, n], k) => (
                <li key={id} className="item-pop flex flex-col items-center" style={{ animationDelay: `${450 + k * 80}ms` }}>
                  <ItemIcon id={id} size={40} />
                  <span className="mt-1 text-sm font-bold">×{n}</span>
                  <span className="text-[11px] text-ink-soft">{NAMES[id]}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            sfx.tap();
            seenLevelUp();
          }}
          className="go-pill mt-6 rounded-full px-14 py-3 text-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
}
