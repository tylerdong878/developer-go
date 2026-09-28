"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { goTo } from "../../travel";

/** Tapping a map object walks the trainer up to it. Drags don't count. */
export function tapObject(slug: string) {
  return (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    goTo(slug);
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
