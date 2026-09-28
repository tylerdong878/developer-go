"use client";

import dynamic from "next/dynamic";

// three.js needs the browser, so the game loads on the client after the page
// shell paints.
const Game = dynamic(() => import("./Game"), { ssr: false, loading: Loading });

function Loading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-sky">
      <p className="font-display text-lg font-medium text-ink-soft">Loading the base...</p>
    </div>
  );
}

export function GameLoader() {
  return <Game />;
}
