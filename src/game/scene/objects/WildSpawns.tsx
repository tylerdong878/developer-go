"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { game } from "../../state";
import { goTo } from "../../travel";
import { goalId, refreshWild, wildStore } from "../../wild";
import { Critter } from "./Critter";

const none: never[] = [];

/**
 * Everyday wild Pokémon, just for fun. A few are always out in the grass a
 * short walk away; new ones pop up and old ones wander off as you move, like
 * GO. Tap one to walk over to it.
 */
export function WildSpawns({ grass }: { grass: string }) {
  const list = useSyncExternalStore(wildStore.subscribe, wildStore.get, () => none);
  const last = useRef(-10);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - last.current < 1) return;
    last.current = now;
    const { x, z } = game.player.trainer.position;
    refreshWild(x, z, now);
  });

  return (
    <>
      {list.map((s) => (
        <group key={s.id} position={[s.x, 0, s.z]}>
          <Critter
            dex={s.species.dex}
            grass={grass}
            seed={s.id}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta > 6) return;
              e.stopPropagation();
              goTo(goalId(s));
            }}
          />
        </group>
      ))}
    </>
  );
}
