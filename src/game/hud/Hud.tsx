"use client";

import { useCallback, useEffect, useState } from "react";
import { bySlug } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { Card } from "./Card";
import { MainMenu, MenuBall, type Screen, TrainerBadge } from "./Menu";
import { Nearby } from "./Nearby";
import { BagPanel, MedalsPanel, PokedexPanel, TrainerPanel } from "./Panels";

/**
 * GO's on-screen controls, laid over the 3D base: the trainer badge, the
 * Poké Ball menu, and Nearby. It sits beside the scene, not inside it, so
 * taps and scrolls here never spin or zoom the camera. Arriving at anything
 * opens its card, and every card has its own link: /#aws dashes you to AWS.
 */
export function Hud() {
  const [card, setCard] = useState<string | null>(null);
  const [screen, setScreen] = useState<Exclude<Screen, "nearby"> | null>(null);
  const [menu, setMenu] = useState(false);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    game.onArrive = (slug) => setCard(slug);
    const fromLink = decodeURIComponent(window.location.hash.slice(1));
    if (bySlug.has(fromLink)) goTo(fromLink, true);
    return () => {
      game.onArrive = null;
    };
  }, []);

  // The keys don't walk the trainer around behind an open screen.
  useEffect(() => {
    game.input.paused = card !== null || screen !== null || menu || nearby;
  }, [card, screen, menu, nearby]);

  useEffect(() => {
    const url = window.location.pathname + window.location.search + (card ? `#${card}` : "");
    window.history.replaceState(null, "", url);
  }, [card]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const closeCard = useCallback(() => setCard(null), []);
  const closeScreen = useCallback(() => setScreen(null), []);
  const openAbout = useCallback(() => {
    setCard(null);
    setScreen("trainer");
  }, []);
  const pick = (s: Screen) => {
    setMenu(false);
    if (s === "nearby") setNearby(true);
    else setScreen(s);
  };
  const object = card ? bySlug.get(card) : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {menu ? (
        <div className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-mystic-900/40 pb-32 backdrop-blur-[2px]">
          <button type="button" aria-label="Close menu" tabIndex={-1} className="absolute inset-0" onClick={() => setMenu(false)} />
          <div className="relative">
            <MainMenu onPick={pick} />
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute bottom-4 left-4">
        <TrainerBadge onOpen={() => setScreen("trainer")} />
      </div>
      <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
        <MenuBall open={menu} onToggle={() => setMenu((m) => !m)} />
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <Nearby open={nearby} setOpen={setNearby} />
      </div>

      <div className="pointer-events-auto">
        {object ? <Card object={object} onClose={closeCard} onAbout={openAbout} /> : null}
        {screen === "trainer" ? <TrainerPanel onClose={closeScreen} /> : null}
        {screen === "pokedex" ? (
          <PokedexPanel
            onClose={closeScreen}
            onOpen={(slug) => {
              setScreen(null);
              setCard(slug);
            }}
          />
        ) : null}
        {screen === "bag" ? <BagPanel onClose={closeScreen} /> : null}
        {screen === "medals" ? <MedalsPanel onClose={closeScreen} /> : null}
      </div>
    </div>
  );
}
