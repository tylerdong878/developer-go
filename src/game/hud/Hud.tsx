"use client";

import { useCallback, useEffect, useState } from "react";
import { bySlug } from "../objects";
import { game } from "../state";
import { goTo } from "../travel";
import { Card } from "./Card";
import { Nearby } from "./Nearby";

/**
 * GO's on-screen controls, laid over the 3D base. It sits beside the scene,
 * not inside it, so taps and scrolls here never spin or zoom the camera.
 * Arriving at anything opens its card, and every card has its own link:
 * /#aws walks you straight to the AWS gym.
 */
export function Hud() {
  const [card, setCard] = useState<string | null>(null);

  useEffect(() => {
    game.onArrive = (slug) => setCard(slug);
    const fromLink = decodeURIComponent(window.location.hash.slice(1));
    if (bySlug.has(fromLink)) goTo(fromLink, true);
    return () => {
      game.onArrive = null;
    };
  }, []);

  useEffect(() => {
    game.input.paused = card !== null;
    const url = window.location.pathname + window.location.search + (card ? `#${card}` : "");
    window.history.replaceState(null, "", url);
  }, [card]);

  const close = useCallback(() => setCard(null), []);
  const object = card ? bySlug.get(card) : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <Nearby />
      </div>
      {object ? (
        <div className="pointer-events-auto">
          <Card object={object} onClose={close} />
        </div>
      ) : null}
    </div>
  );
}
