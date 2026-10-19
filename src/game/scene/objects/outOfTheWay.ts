"use client";

import { useFrame } from "@react-three/fiber";
import { type RefObject, useLayoutEffect, useRef } from "react";
import type { Material, Mesh, Object3D } from "three";
import { game } from "../../state";

/**
 * Every solid material under a group, skipping Pokémon (marked noShadow):
 * they share materials across every model, so they get `pokemon` instead.
 */
function solids(root: Object3D, visit: (m: Material) => void, pokemon?: (o: Object3D) => void) {
  const walk = (o: Object3D) => {
    if (o.userData.noShadow) return pokemon?.(o);
    const m = (o as Mesh).material as Material | Material[] | undefined;
    if (m && (o as Mesh).isMesh) for (const mat of Array.isArray(m) ? m : [m]) if (!mat.transparent) visit(mat);
    o.children.forEach(walk);
  };
  walk(root);
}

/**
 * Anything standing between the camera and the trainer dithers out of the
 * way, the way buildings and trees already do (notes/research/gfx-audit.md
 * D3, E5): gyms and statues. Their solid materials switch to alpha-hash once,
 * then their opacity eases with how much they're in the way. `radius` is how
 * wide the thing is, in meters; something long (the ferry) gives `length`
 * too, along x, and any point down its middle counts.
 */
export function useOutOfTheWay(group: RefObject<Object3D | null>, x: number, z: number, radius: number, length = 0) {
  const shown = useRef(1);

  useLayoutEffect(() => {
    if (!group.current) return;
    solids(group.current, (m) => {
      if (m.alphaHash) return;
      m.alphaHash = true;
      m.needsUpdate = true;
    });
  });

  useFrame(({ camera }, dt) => {
    const { position } = game.player.trainer;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const sx = position.x - cx;
    const sz = position.z - cz;
    const span = sx * sx + sz * sz || 1;
    const steps = Math.ceil(length / (radius * 1.5));
    let inTheWay = false;
    for (let i = 0; i <= steps && !inTheWay; i++) {
      const px = steps ? x - length / 2 + (length * i) / steps : x;
      const t = ((px - cx) * sx + (z - cz) * sz) / span;
      const along = Math.max(0, Math.min(1, t));
      const off = Math.hypot(px - (cx + along * sx), z - (cz + along * sz));
      inTheWay = t > 0 && t < 0.92 && off < radius;
    }
    let f = shown.current + ((inTheWay ? 0.12 : 1) - shown.current) * (1 - Math.exp(-8 * dt));
    if (f > 0.99) f = 1;
    if (f === shown.current || !group.current) return;
    shown.current = f;
    // a Pokémon on top (a gym's defender) can't fade on its own, so it steps out once the rest is mostly gone
    solids(group.current, (m) => (m.opacity = f), (o) => (o.visible = f > 0.45));
  });
}
