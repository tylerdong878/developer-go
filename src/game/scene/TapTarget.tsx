"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import { walkable } from "../base";
import { game } from "../state";

/**
 * Tap or click the ground and the trainer walks there. The ground itself is
 * an invisible plane that only catches taps; a small white ring marks the spot.
 * Drags don't count, so spinning the camera never sends him walking.
 */
export function TapTarget() {
  const marker = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const m = marker.current;
    if (!m) return;
    const target = game.input.target;
    m.visible = !!target;
    if (target) {
      m.position.set(target.x, 0.04, target.z);
      m.scale.setScalar(1 + 0.12 * Math.sin(clock.elapsedTime * 6));
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    if (walkable([e.point.x, e.point.z])) game.input.target = e.point.clone().setY(0);
  };

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} visible={false} onClick={onClick}>
        <planeGeometry args={[900, 900]} />
      </mesh>
      <mesh ref={marker} rotation-x={-Math.PI / 2} renderOrder={-16} visible={false}>
        <ringGeometry args={[0.5, 0.78, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </>
  );
}
