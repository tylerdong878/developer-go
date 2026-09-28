"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import type { Mover } from "../player";

/** How far the trainer can reach, like GO's pink circle. */
export const REACH = 9;

/**
 * GO's rings at the trainer's feet: a pink circle for his reach, a white ring
 * that pings out from his feet, and a soft white disc under him.
 */
export function Rings({ mover, still }: { mover: Mover; still: boolean }) {
  const root = useRef<Group>(null);
  const ping = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!root.current || !ping.current) return;
    root.current.position.set(mover.position.x, 0.03, mover.position.z);
    const t = still ? 0.6 : (clock.elapsedTime % 2.4) / 2.4;
    ping.current.scale.setScalar(1 + t * 5);
    (ping.current.material as MeshBasicMaterial).opacity = still ? 0.5 : 1 - t;
  });

  return (
    <group ref={root} rotation-x={-Math.PI / 2}>
      <mesh renderOrder={-20}>
        <circleGeometry args={[REACH, 96]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <mesh renderOrder={-19}>
        <ringGeometry args={[REACH - 0.14, REACH + 0.14, 128]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh ref={ping} renderOrder={-18}>
        <ringGeometry args={[0.95, 1.08, 64]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      <mesh renderOrder={-17}>
        <circleGeometry args={[0.9, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}
