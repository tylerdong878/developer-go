"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const GREETING =
  "Hey! I'm Tyler. This is my portfolio, built as a Pokémon GO world. Gyms are my jobs, PokéStops are my projects, raids are hackathons, and the sparkly Pokémon are facts about me.";

/** A spinning Poké Ball, for while the world loads. */
export function BallSpinner({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="ball-spin shrink-0" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fff" />
      <path d="M2 32a30 30 0 0 1 60 0Z" fill="#e3350d" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#1c1c24" strokeWidth="4" />
      <path d="M2.5 32h59" stroke="#1c1c24" strokeWidth="5" />
      <circle cx="32" cy="32" r="9" fill="#fff" stroke="#1c1c24" strokeWidth="5" />
    </svg>
  );
}

/**
 * The intro, on top of the real world: the camera circles Tyler and Teddy
 * while a classic Pokémon text box types out who he is. Tap anywhere (or
 * press Enter) to start.
 */
export function Intro({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  const [shown, setShown] = useState(0);

  // Type the greeting out a few letters at a time, like the games.
  useEffect(() => {
    if (!ready || shown >= GREETING.length) return; // wait for the loading screen to clear
    const id = window.setTimeout(() => setShown((n) => Math.min(GREETING.length, n + 2)), shown ? 28 : 900);
    return () => window.clearTimeout(id);
  }, [shown, ready]);

  const typed = shown >= GREETING.length;
  const canStart = ready && typed;
  const go = () => {
    if (!ready) return;
    if (!typed) setShown(GREETING.length); // first tap finishes the text, like the games
    else onStart();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="absolute inset-0 z-[70]">
      <button
        type="button"
        onClick={go}
        aria-label={canStart ? "Start" : "Loading"}
        className="absolute inset-0 cursor-pointer bg-linear-to-t from-mystic-900/45 via-transparent to-transparent"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-8">
        <div className="dialog-box pointer-events-auto relative w-full max-w-2xl px-6 pt-5 pb-7" onClick={go}>
          <p className="min-h-[5.5em] font-display text-lg leading-snug font-medium text-[#1c2a3a] sm:text-xl">
            {GREETING.slice(0, shown)}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold text-[#3d5a75]">
            {ready ? (
              <span>{typed ? "Tap anywhere to start" : " "}</span>
            ) : (
              <span className="flex items-center gap-2">
                <BallSpinner size={20} /> Loading the world...
              </span>
            )}
            <Link href="/text" className="underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
              In a hurry? Text version
            </Link>
          </div>
          {canStart ? <span className="dialog-next absolute right-5 bottom-2 text-xl text-[#e3350d]">▼</span> : null}
        </div>
      </div>
    </div>
  );
}
