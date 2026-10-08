"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { startedStore } from "../ready";
import { bySlug } from "../objects";
import { slots } from "../base";
import { game, ZOOM } from "../state";
import { goTo } from "../travel";
import { gainXp, progressStore, recordCatch, recordVisit } from "../progress";
import { buddyStore } from "../buddy";
import { count } from "../community";
import { catchRewards, cpFor } from "../cp";
import { sfx } from "../sound";
import { earned, visitorMedals } from "../visitorMedals";
import { findWild, removeWild } from "../wild";
import { Encounter, type Foe, type Thrown } from "./Encounter";
import { FactToast, XpPops } from "./Xp";
import { Card } from "./Card";
import { MainMenu, MenuBall, type Screen, TrainerBadge } from "./Menu";
import { Nearby } from "./Nearby";
import { Prompt } from "./Prompt";
import { Minimap } from "./Minimap";
import { SettingsPanel } from "./Settings";
import { PokemonPanel } from "./Storage";
import { CommunityPanel } from "./Community";
import { BagPanel, BuddyPanel, PokedexPanel, ProfilePanel, TrainerPanel } from "./Panels";

/**
 * GO's on-screen controls, laid over the 3D base: the trainer badge, the
 * Poké Ball menu, and Nearby. It sits beside the scene, not inside it, so
 * taps and scrolls here never spin or zoom the camera. Arriving at anything
 * opens its card, and every card has its own link: /#aws dashes you to AWS.
 */
export function Hud() {
  const started = useSyncExternalStore(startedStore.subscribe, startedStore.get, startedStore.server);
  const [card, setCard] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [menu, setMenu] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [foe, setFoe] = useState<(Foe & { goal: string }) | null>(null);
  const [buddy, setBuddy] = useState(false);
  const [fact, setFact] = useState<string | null>(null);

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
  // Little things: the tab calls you back when you leave, and the console says hi.
  useEffect(() => {
    const title = document.title;
    const onVisible = () => {
      document.title = document.hidden ? "Teddy misses you | Tyler Dong" : title;
    };
    document.addEventListener("visibilitychange", onVisible);
    console.log(
      "%cHey, you found the console.%c\nThis base is open source: https://github.com/tylerdong878/developer-go",
      "font: 600 16px sans-serif; color: #0b84d6",
      "font: 13px sans-serif",
    );
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.title = title;
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
      // The Pokémon Center is where you learn about Tyler; the Poké Mart is your bag.
      if (goal === "place:center" || goal === "place:mart") {
        sfx.open();
        return setScreen(goal === "place:center" ? "about" : "bag");
      }
      const w = findWild(goal);
      if (w) return setFoe({ dex: w.species.dex, name: w.species.name, rare: false, cp: cpFor(w.species.dex, false, Math.random()), goal });
      const o = bySlug.get(goal);
      if (o?.kind === "spawn") return setFoe({ dex: o.pokemon.dex, name: o.pokemon.name, rare: true, cp: cpFor(o.pokemon.dex, true, Math.random()), goal });
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

  // Opening a card frames its object: the camera swings around to put it
  // ahead of the trainer and moves in a little, then eases back on close.
  useEffect(() => {
    const at = card ? slots[card] : undefined;
    if (!at) return;
    const { view } = game;
    const { x, z } = game.player.trainer.position;
    const want = Math.atan2(at[0] - x, -(at[1] - z));
    let d = (want - view.yawTo) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    view.yawTo += d;
    const before = view.distanceTo;
    view.distanceTo = Math.max(ZOOM.min, Math.min(before, 16));
    return () => {
      view.distanceTo = before;
    };
  }, [card]);

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
  const closeFact = useCallback(() => setFact(null), []);
  const factSpawn = fact ? bySlug.get(fact) : undefined;
  const closeScreen = useCallback(() => setScreen(null), []);
  const openAbout = useCallback(() => {
    setCard(null);
    setScreen("about");
  }, []);
  const pick = (s: Screen) => {
    sfx.open();
    setMenu(false);
    setScreen(s);
  };
  const object = card ? bySlug.get(card) : undefined;
  const endCatch = (caught: boolean, best: Thrown) => {
    if (!foe) return;
    const w = findWild(foe.goal);
    if (w) removeWild(w.id);
    if (caught) {
      const rewards = catchRewards(foe.rare, best, !progressStore.get().caught[foe.dex]);
      recordCatch({ dex: foe.dex, name: foe.name, cp: foe.cp, throw: best });
      count("catches", { dex: foe.dex, cp: foe.cp });
      gainXp(
        rewards.reduce((sum, [, xp]) => sum + xp, 0),
        rewards.length > 1 ? rewards[rewards.length - 1][0].toLowerCase() : "caught",
      );
    }
    setFoe(null);
    if (!caught || !foe.rare) return;
    // A caught fact Pokémon drops its fact in as a toast. Snorlax still opens its card: waking it leads to About.
    const o = bySlug.get(foe.goal);
    if (o?.kind === "spawn" && !o.opensAbout) setFact(foe.goal);
    else setCard(foe.goal);
  };

  if (!started) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {menu ? (
        <div className="pointer-events-auto absolute inset-0 flex justify-center sm:p-4">
          <button type="button" aria-label="Close menu" tabIndex={-1} className="scrim-in absolute inset-0 bg-[#0a2a4a]/30" onClick={() => setMenu(false)} />
          <MainMenu onPick={pick} />
        </div>
      ) : null}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {factSpawn?.kind === "spawn" ? <FactToast key={factSpawn.slug} spawn={factSpawn} onDone={closeFact} /> : null}
        <XpPops />
      </div>

      <div className={`pointer-events-auto absolute top-4 right-4 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
        <Minimap />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
        <Prompt hidden={card !== null || screen !== null || menu || nearby || foe !== null || buddy} />
      </div>
      <div className={`pointer-events-auto absolute bottom-4 left-4 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
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
      <div className={`pointer-events-auto absolute right-4 bottom-4 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
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
        {screen === "settings" ? <SettingsPanel onClose={closeScreen} /> : null}
        {screen === "pokemon" ? <PokemonPanel onClose={closeScreen} /> : null}
        {screen === "community" ? <CommunityPanel onClose={closeScreen} /> : null}
        {buddy ? <BuddyPanel onClose={() => setBuddy(false)} /> : null}
        {foe ? <Encounter key={foe.goal} foe={foe} onDone={endCatch} /> : null}
      </div>
    </div>
  );
}
