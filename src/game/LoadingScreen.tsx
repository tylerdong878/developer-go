"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trainer } from "@/content";

/**
 * A loading screen like GO's: sky over a green hill, a Poké Ball bouncing on
 * it, a progress bar, and the game's famous line along the bottom. Above it,
 * who this is, with the resume and the plain page a tap away even while the
 * world loads. It fades out once the world is drawn (after a short minimum, so
 * it never flashes).
 */
export function LoadingScreen({ ready }: { ready: boolean }) {
  const [progress, setProgress] = useState(0.05);
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);

  // Creep toward 90% while loading; fill up when the world is ready.
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => setProgress((p) => p + (0.9 - p) * 0.07), 120);
    return () => clearInterval(id);
  }, [ready]);
  useEffect(() => {
    const id = window.setTimeout(() => setMinDone(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  const done = ready && minDone;
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setGone(true), 600);
    return () => window.clearTimeout(id);
  }, [done]);

  if (gone) return null;
  return (
    <div
      className={`loading-screen absolute inset-0 z-[80] flex flex-col items-center justify-center transition-opacity duration-500 ${done ? "opacity-0" : "opacity-100"}`}
    >
      <div className="mb-14 px-6 text-center text-white drop-shadow">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">{trainer.name}</h1>
        {trainer.headline.map((line) => (
          <p key={line} className="mt-1 font-display text-base font-medium sm:text-lg">
            {line}
          </p>
        ))}
        <p className="mt-4 flex flex-wrap justify-center gap-2">
          <a href="/resume" className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-mystic-700 shadow transition hover:scale-105">
            Resume
          </a>
          <Link href="/text" className="rounded-full bg-white/25 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/70 transition hover:bg-white/35">
            Plain version
          </Link>
          <a href={`mailto:${trainer.email}`} className="rounded-full bg-white/25 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/70 transition hover:bg-white/35">
            Email
          </a>
        </p>
      </div>
      <div className="relative flex flex-col items-center">
        <svg viewBox="0 0 64 64" width="96" height="96" className="loading-ball" aria-hidden>
          <circle cx="32" cy="32" r="30" fill="#fff" />
          <path d="M2 32a30 30 0 0 1 60 0Z" fill="#e3350d" />
          <circle cx="32" cy="32" r="30" fill="none" stroke="#1c1c24" strokeWidth="3.5" />
          <path d="M2.5 32h59" stroke="#1c1c24" strokeWidth="4.5" />
          <circle cx="32" cy="32" r="9" fill="#fff" stroke="#1c1c24" strokeWidth="4.5" />
          <circle cx="32" cy="32" r="4" fill="#f4f4f4" />
        </svg>
        <span className="loading-shadow mt-1 block h-3 w-16 rounded-[50%] bg-mystic-900/25" aria-hidden />
      </div>
      <div
        role="progressbar"
        aria-label="Loading the world"
        aria-valuenow={Math.round((done ? 1 : progress) * 100)}
        className="mt-8 h-2 w-56 overflow-hidden rounded-full bg-white/40"
      >
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300"
          style={{ width: `${(done ? 1 : progress) * 100}%` }}
        />
      </div>
      <p className="absolute inset-x-0 bottom-8 px-6 text-center font-display text-base font-semibold text-white drop-shadow sm:text-lg">
        Remember to be alert at all times.
        <br />
        Stay aware of your surroundings.
      </p>
    </div>
  );
}
