"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { startedStore } from "../ready";
import { bySlug } from "../objects";
import { slots } from "../base";
import { game, ZOOM } from "../state";
import { goTo } from "../travel";
import { gainXp, progressStore, recordBonus, recordCatch, recordHatch, recordVisit } from "../progress";
import { BONUS_RATE, bossCp, HATCH_MS, premierBalls, RAID_BOSS } from "../raidBosses";
import { played } from "../bond";
import { buddyStore } from "../buddy";
import { count } from "../community";
import { catchRewards, cpFor, FLED_XP } from "../cp";
import { sfx } from "../sound";
import { earned, visitorMedals } from "../visitorMedals";
import { findWild, holdWild, removeWild } from "../wild";
import { BOOST_CP, boosted } from "../species";
import { weatherStore } from "../weather";
import { type CatchResult, Encounter, type Foe } from "./Encounter";
import { FactToast, XpPops } from "./Xp";
import { Card } from "./Card";
import { MainMenu, MenuBall, type Screen, TrainerBadge } from "./Menu";
import { Nearby } from "./Nearby";
import { Prompt } from "./Prompt";
import { ResearchButton, ResearchPanel } from "./Research";
import { Minimap } from "./Minimap";
import { MuteButton } from "./MuteButton";
import { WeatherBadge } from "./WeatherBadge";
import { SettingsPanel } from "./Settings";
import { PokemonPanel } from "./Storage";
import { CommunityPanel } from "./Community";
import { BagPanel, BuddyPanel, HighlightsPanel, PokedexPanel, ProfilePanel, TeddyFace, TrainerPanel } from "./Panels";
import { clearScreenRequest, screenRequest } from "./request";

/** Swings the camera round to put a map object ahead of the trainer. */
function face(slug: string) {
  const at = slots[slug];
  if (!at) return;
  const { view } = game;
  const { x, z } = game.player.trainer.position;
  const want = Math.atan2(at[0] - x, -(at[1] - z));
  let d = (want - view.yawTo) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  view.yawTo += d;
}

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
      played();
    });
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    // Walking up to a Pokémon starts a catch; anything else opens its card.
    game.onArrive = (goal) => {
      // The Pokémon Center is where you learn about Tyler; the Poké Mart is your bag.
      if (goal === "place:center" || goal === "place:mart" || goal === "place:lab") {
        sfx.open();
        recordVisit(goal);
        // the lab is where Tyler studies, so it opens his school and skills, like the Center
        return setScreen(goal === "place:mart" ? "bag" : "about");
      }
      const w = findWild(goal);
      if (w) {
        // it stays on the map until the catch is over
        holdWild(w.id);
        // boosted by the weather: stronger, like GO's five extra levels
        const weather = weatherStore.get();
        const boost = boosted(w.species.dex, weather);
        const cp = Math.round(cpFor(w.species.dex, false, Math.random()) * (boost ? BOOST_CP : 1));
        return setFoe({ dex: w.species.dex, name: w.species.name, rare: false, cp, goal, boost: boost ? weather : undefined });
      }
      const o = bySlug.get(goal);
      // the first time you walk up to a raid, its egg hatches (scene/objects/Gym.tsx), then the raid opens
      if (o?.kind === "raid" && RAID_BOSS[goal] && !progressStore.get().hatched.includes(goal)) {
        recordHatch(goal);
        sfx.hatch();
        face(goal);
        window.setTimeout(() => game.onArrive?.(goal), HATCH_MS);
        return;
      }
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
    if (!card || !slots[card]) return;
    face(card);
    const { view } = game;
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
  // GO's bonus round: one try at the raid's boss, with Premier Balls
  const startBonus = useCallback((slug: string) => {
    const raid = bySlug.get(slug);
    const boss = RAID_BOSS[slug];
    if (raid?.kind !== "raid" || !boss || slug in progressStore.get().bonus) return;
    setCard(null);
    setFoe({ dex: boss.dex, name: boss.name, rare: false, cp: bossCp(boss, Math.random()), goal: slug, premier: { balls: premierBalls(raid), rate: BONUS_RATE[raid.stars] } });
  }, []);
  const closeFact = useCallback(() => setFact(null), []);
  const factSpawn = fact ? bySlug.get(fact) : undefined;
  const closeScreen = useCallback(() => setScreen(null), []);
  const pickTab = useCallback((tab: "tyler" | "you") => setScreen(tab === "tyler" ? "about" : "profile"), []);
  // a highlight: close the list and dash there, and its card opens on arrival
  const goHighlight = useCallback((slug: string) => {
    setScreen(null);
    goTo(slug, true);
  }, []);
  // a screen the intro asked for (its Highlights link), once the HUD is up
  useEffect(() => {
    const check = () => {
      const want = screenRequest.get();
      if (!want || !startedStore.get()) return;
      clearScreenRequest();
      setScreen(want);
    };
    const offRequest = screenRequest.subscribe(check);
    const offStart = startedStore.subscribe(check);
    return () => {
      offRequest();
      offStart();
    };
  }, []);
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
  const endCatch = ({ outcome, best, firstThrow, curve }: CatchResult) => {
    if (!foe) return;
    const caught = outcome === "caught";
    holdWild(null);
    // running away leaves it where it was, like GO; caught or fled, it's gone
    const w = findWild(foe.goal);
    if (w && outcome !== "ran") removeWild(w.id);
    if (w && outcome === "fled") gainXp(FLED_XP, "it fled");
    if (caught) {
      const rewards = catchRewards(foe.rare, best, !progressStore.get().caught[foe.dex], firstThrow, curve);
      recordCatch({ dex: foe.dex, name: foe.name, cp: foe.cp, throw: best });
      count("catches", { dex: foe.dex, cp: foe.cp });
      gainXp(
        rewards.reduce((sum, [, xp]) => sum + xp, 0),
        rewards.length > 1 ? rewards[rewards.length - 1][0].toLowerCase() : "caught",
      );
    }
    setFoe(null);
    if (foe.premier) {
      recordBonus(foe.goal, caught);
      return setCard(foe.goal);
    }
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

      <div className={`pointer-events-auto absolute top-4 right-4 flex flex-col items-end gap-2 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
        <Minimap />
        <WeatherBadge />
        <MuteButton />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
        <Prompt hidden={card !== null || screen !== null || menu || nearby || foe !== null || buddy} />
      </div>
      <div className={`pointer-events-auto absolute bottom-4 left-4 flex items-end gap-1.5 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
        <TrainerBadge onOpen={() => setScreen("about")} />
        {/* GO keeps your buddy by your avatar: Teddy, one tap from his screen */}
        <button
          type="button"
          onClick={() => {
            sfx.open();
            setBuddy(true);
          }}
          aria-label="Teddy, your buddy"
          className="panel grid size-10 place-items-center rounded-full transition hover:scale-105 active:scale-95"
        >
          <TeddyFace size={30} />
        </button>
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
      <div className={`pointer-events-auto absolute right-4 bottom-4 flex flex-col items-end gap-3 transition-opacity ${menu ? "invisible opacity-0" : ""}`}>
        <ResearchButton
          onOpen={() => {
            sfx.open();
            setScreen("research");
          }}
        />
        <Nearby open={nearby} setOpen={setNearby} />
      </div>

      <div className="pointer-events-auto">
        {object ? <Card object={object} onClose={closeCard} onAbout={openAbout} onBonus={startBonus} /> : null}
        {screen === "profile" ? <ProfilePanel onClose={closeScreen} onTab={pickTab} /> : null}
        {screen === "about" ? <TrainerPanel onClose={closeScreen} onTab={pickTab} /> : null}
        {screen === "highlights" ? <HighlightsPanel onClose={closeScreen} onGo={goHighlight} /> : null}
        {screen === "research" ? <ResearchPanel onClose={closeScreen} /> : null}
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
