"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { startedStore } from "../ready";
import { bySlug } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { gainXp, progressStore, recordCatch, recordVisit } from "../progress";
import { buddyStore } from "../buddy";
import { count } from "../community";
import { sfx } from "../sound";
import { earned, visitorMedals } from "../visitorMedals";
import { findWild, removeWild } from "../wild";
import { Encounter, type Foe, type Thrown } from "./Encounter";
import { XpPops } from "./Xp";
import { Card } from "./Card";
import { MainMenu, MenuBall, type Screen, TrainerBadge } from "./Menu";
import { Nearby } from "./Nearby";
import { BagPanel, BuddyPanel, MedalsPanel, PokedexPanel, ProfilePanel, TrainerPanel } from "./Panels";

/**
 * GO's on-screen controls, laid over the 3D base: the trainer badge, the
 * Poké Ball menu, and Nearby. It sits beside the scene, not inside it, so
 * taps and scrolls here never spin or zoom the camera. Arriving at anything
 * opens its card, and every card has its own link: /#aws dashes you to AWS.
 */
export function Hud() {
  const started = useSyncExternalStore(startedStore.subscribe, startedStore.get, startedStore.server);
  const [card, setCard] = useState<string | null>(null);
  const [screen, setScreen] = useState<Exclude<Screen, "nearby"> | null>(null);
  const [menu, setMenu] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [foe, setFoe] = useState<(Foe & { goal: string }) | null>(null);
  const [buddy, setBuddy] = useState(false);

  // Earning a visitor medal is worth 200 XP. Medals already earned on an
  // earlier visit don't pay out again.
  useEffect(() => {
    let have = new Set(earned(progressStore.get()));
    const off = progressStore.subscribe(() => {
      const p = progressStore.get();
      const now = earned(p).filter((id) => !have.has(id));
      if (!now.length) return;
      have = new Set([...have, ...now]);
      for (const id of now) {
        const medal = visitorMedals(p).find((m) => m.id === id);
        window.setTimeout(() => gainXp(200, `medal: ${medal?.title ?? id}`), 500);
      }
    });
    return () => {
      off();
    };
  }, []);
  const pettedOnce = useRef(false);

  // Petting Teddy opens his buddy screen (and the first pet each visit is worth a little XP).
  useEffect(() => {
    const off = buddyStore.subscribe(() => {
      setBuddy(true);
      sfx.open();
      if (!pettedOnce.current) {
        pettedOnce.current = true;
        gainXp(20, "played with Teddy");
      }
    });
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    // Walking up to a Pokémon starts a catch; anything else opens its card.
    game.onArrive = (goal) => {
      const w = findWild(goal);
      if (w) return setFoe({ dex: w.species.dex, name: w.species.name, rare: false, goal });
      const o = bySlug.get(goal);
      if (o?.kind === "spawn") return setFoe({ dex: o.pokemon.dex, name: o.pokemon.name, rare: true, goal });
      setCard(goal);
      sfx.open();
      if (o && !progressStore.get().visited.includes(goal)) {
        recordVisit(goal);
        count("visits");
        gainXp(250, "first visit");
      }
    };
    const fromLink = decodeURIComponent(window.location.hash.slice(1));
    if (bySlug.has(fromLink)) goTo(fromLink, true);
    return () => {
      game.onArrive = null;
    };
  }, []);

  // The keys don't walk the trainer around behind an open screen.
  useEffect(() => {
    game.input.paused = card !== null || screen !== null || menu || nearby || foe !== null || buddy;
  }, [card, screen, menu, nearby, foe, buddy]);

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
    setScreen("about");
  }, []);
  const pick = (s: Screen) => {
    sfx.open();
    setMenu(false);
    if (s === "nearby") setNearby(true);
    else setScreen(s);
  };
  const object = card ? bySlug.get(card) : undefined;
  const endCatch = (caught: boolean, best: Thrown) => {
    if (!foe) return;
    const w = findWild(foe.goal);
    if (w) removeWild(w.id);
    if (caught) {
      recordCatch(foe.dex);
      count("catches");
      const bonus = best === "Excellent" ? 100 : best === "Great" ? 50 : best === "Nice" ? 10 : 0;
      gainXp((foe.rare ? 500 : 100) + bonus, best ? `${best} throw` : "caught");
    }
    setFoe(null);
    if (caught && foe.rare) setCard(foe.goal); // a caught fact Pokémon shows its fact
  };

  if (!started) return null;
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
      <XpPops />

      <div className="pointer-events-auto absolute bottom-4 left-4">
        <TrainerBadge onOpen={() => setScreen("profile")} />
      </div>
      <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
        <MenuBall
          open={menu}
          onToggle={() => {
            sfx.tap();
            setMenu((m) => !m);
          }}
        />
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <Nearby open={nearby} setOpen={setNearby} />
      </div>

      <div className="pointer-events-auto">
        {object ? <Card object={object} onClose={closeCard} onAbout={openAbout} /> : null}
        {screen === "profile" ? <ProfilePanel onClose={closeScreen} /> : null}
        {screen === "about" ? <TrainerPanel onClose={closeScreen} /> : null}
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
        {buddy ? <BuddyPanel onClose={() => setBuddy(false)} /> : null}
        {foe ? <Encounter key={foe.goal} foe={foe} onDone={endCatch} /> : null}
      </div>
    </div>
  );
}
