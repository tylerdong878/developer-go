"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Egg as EggContent } from "@/content";
import { EGG_SPOTS as SPOTS } from "../../colors";
import { Shadow } from "../Shadow";
import { Nameplate } from "./Nameplate";
import { hover, tapObject } from "./tap";

/** Where the spots sit on the shell, as directions from its center. */
const SPOT_AT: [number, number, number][] = [
  [0.8, 0.35, 0.5],
  [-0.7, 0.1, 0.7],
  [0.2, -0.3, 0.95],
  [-0.4, 0.75, 0.5],
  [0.6, -0.1, -0.8],
  [-0.85, -0.2, -0.45],
  [0.1, 0.55, -0.85],
];

/**
 * Work in progress, as an egg in an incubator at home. It wobbles now and
 * then like it's about to hatch.
 */
export function Egg({ egg, x, z }: { egg: EggContent; x: number; z: number }) {
  const shell = useRef<Group>(null);
  const color = SPOTS[egg.km];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + x;
    if (!shell.current) return;
    const shaking = Math.sin(t * 0.8) > 0.7 ? 1 : 0.1;
    shell.current.rotation.z = Math.sin(t * 14) * 0.1 * shaking;
  });

  return (
    <group position={[x, 0, z]}>
      <group onClick={tapObject(egg.slug)} {...hover}>
        <Shadow size={1.9} />
        <mesh position-y={0.14}>
          <cylinderGeometry args={[0.66, 0.74, 0.28, 24]} />
          <meshStandardMaterial color="#3a4250" roughness={0.6} />
        </mesh>
        <mesh position-y={0.34} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.58, 0.13, 12, 32]} />
          <meshStandardMaterial color="#f28a2e" roughness={0.45} emissive="#f28a2e" emissiveIntensity={0.15} />
        </mesh>
        <group ref={shell} position-y={0.36}>
          <group position-y={0.64}>
            <mesh scale={[1, 1.3, 1]}>
              <sphereGeometry args={[0.5, 28, 20]} />
              <meshStandardMaterial color="#fbfbf6" roughness={0.45} />
            </mesh>
            {SPOT_AT.map(([dx, dy, dz], i) => {
              const k = 0.47 / Math.hypot(dx, dy, dz);
              return (
                <mesh key={i} position={[dx * k, dy * k * 1.3, dz * k]}>
                  <sphereGeometry args={[0.1 + (i % 3) * 0.02, 12, 10]} />
                  <meshStandardMaterial color={color} roughness={0.5} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>
      <Nameplate text={egg.title} accent={color} x={x} z={z} y={2.7} />
    </group>
  );
}
