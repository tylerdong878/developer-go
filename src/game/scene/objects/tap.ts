"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three";
import { walkable } from "../../base";
import { game } from "../../state";

/**
 * Tapping a map object walks the trainer up to it and stops just in front,
 * facing it. Drags don't count.
 */
export function walkTo(x: number, z: number, stopShort = 3) {
  return (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const { position } = game.player.trainer;
    const dx = position.x - x;
    const dz = position.z - z;
    const d = Math.hypot(dx, dz) || 1;
    const spot = new Vector3(x + (dx / d) * stopShort, 0, z + (dz / d) * stopShort);
    game.input.target = walkable([spot.x, spot.z]) ? spot : new Vector3(x, 0, z);
  };
}

/** A pointer cursor while hovering something tappable. */
export const hover = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};
