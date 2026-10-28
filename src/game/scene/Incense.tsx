"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { type Group, MeshBasicMaterial, SphereGeometry } from "three";
import { progressStore } from "../progress";
import { game } from "../state";

/*
 * GO's Incense on the map (notes/research/go-round-5.md 4): a pink cloud that
 * swirls slowly round your feet and follows you while it burns.
 */

const puff = new SphereGeometry(1, 10, 8);
const pink = new MeshBasicMaterial({ color: "#f39ad8", transparent: true, opacity: 0.42, depthWrite: false });
// the Daily Adventure Incense's own blue
const blue = new MeshBasicMaterial({ color: "#8cc8f5", transparent: true, opacity: 0.42, depthWrite: false });
const PUFFS = 12;

export function IncenseCloud() {
  const { incenseUntil, incenseKind } = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.server);
  const ring = useRef<Group>(null);
  const smoke = incenseKind === "daily" ? blue : pink;
  useFrame(({ clock }) => {
    const g = ring.current;
    if (!g) return;
    const on = (incenseUntil ?? 0) > Date.now();
    g.visible = on;
    if (!on) return;
    const { x, z } = game.player.trainer.position;
    const t = clock.elapsedTime;
    g.position.set(x, 0, z);
    g.rotation.y = t * 0.35;
    g.children.forEach((c, k) => {
      c.position.y = 0.35 + Math.sin(t * 1.3 + k) * 0.12;
      c.scale.setScalar(0.38 + 0.08 * Math.sin(t * 0.9 + k * 1.7));
    });
  });
  return (
    <group ref={ring} visible={false}>
      {Array.from({ length: PUFFS }, (_, k) => {
        const a = (k / PUFFS) * Math.PI * 2;
        return <mesh key={k} geometry={puff} material={smoke} position={[Math.sin(a) * 1.25, 0.35, Math.cos(a) * 1.25]} />;
      })}
    </group>
  );
}
