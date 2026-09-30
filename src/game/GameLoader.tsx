"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { trainer } from "@/content";
import { BallSpinner, Intro } from "./Intro";
import { markStarted, readyStore, startedStore } from "./ready";
import { unlockSound } from "./sound";
import { game } from "./state";

// three.js needs the browser, so the game loads on the client after the page
// shell paints, under the intro.
const Game = dynamic(() => import("./Game"), { ssr: false });

/** Can this browser draw 3D at all? Checked once: browsers limit how many 3D contexts a page can make. */
let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement("canvas");
    webgl = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  return webgl;
}

/** For browsers that can't run the game: the text version is one tap away. */
function NoGame() {
  return (
    <div className="absolute inset-0 z-[70] flex items-end justify-center bg-sky p-4 sm:p-8">
      <div className="dialog-box w-full max-w-2xl px-6 py-5">
        <p className="flex items-center gap-3 font-display text-lg font-medium text-[#1c2a3a]">
          <BallSpinner size={24} />
          This browser can&apos;t run the 3D world, but everything is in the text version.
        </p>
        <Link href="/text" className="mt-3 inline-block font-display font-semibold text-[#0b84d6] underline underline-offset-2">
          Read {trainer.name}&apos;s portfolio as text
        </Link>
      </div>
    </div>
  );
}

const never = () => () => {};

export function GameLoader() {
  const ready = useSyncExternalStore(readyStore.subscribe, readyStore.get, readyStore.server);
  const started = useSyncExternalStore(startedStore.subscribe, startedStore.get, startedStore.server);
  const skip = useSyncExternalStore(never, () => window.location.hash.length > 1, () => false);
  const canPlay = useSyncExternalStore(never, hasWebGL, () => true);

  // Links straight to a card (like /#aws) skip the intro.
  useEffect(() => {
    if (skip) markStarted();
  }, [skip]);

  useEffect(() => {
    game.input.locked = !started;
  }, [started]);

  const start = () => {
    unlockSound();
    markStarted();
  };

  if (!canPlay) return <NoGame />;
  return (
    <>
      <Game />
      {started ? null : <Intro ready={ready} onStart={start} />}
    </>
  );
}
