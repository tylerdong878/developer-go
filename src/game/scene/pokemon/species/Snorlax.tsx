"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, TorusGeometry } from "three";
import { ball, cone, cutout, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Snorlax, asleep in the official artwork's pose (notes/research/species-3.md):
 * seated on its rump, legs forward with the soles out, arms hanging wide,
 * eyes shut. That's how it naps across the road and blocks it, like the old
 * games. The cream mask covers the whole lower face with a teal V notch, the
 * closed eyes sit on the cream, the fangs point up from the mouth corners,
 * and the arms are the widest part of the silhouette, with five little claws.
 */

const TEAL = "#2f7a97";
const CREAM = "#efe5d6";
const PAD = "#7d6b5b";
const CLAW = "#e4e1dc";
const DARK = "#1c1620";

const notch = cutout([[-0.09, 0], [0.09, 0], [0, -0.065]], 0.04);
const closedEye = new TorusGeometry(0.14, 0.006, 6, 16, 0.42);
/** Foot claws around the sole's rim (degrees, for the right foot; mirrored on the left). */
const FOOT_CLAWS = [88, 55, 28];

export function Snorlax({ asleep = true }: ModelProps) {
  const belly = useRef<Group>(null);
  useFrame(({ clock }) => {
    // slow, deep breathing while it naps
    const k = 1 + Math.sin(clock.elapsedTime * (asleep ? 1.2 : 2)) * 0.025;
    belly.current?.scale.set(k, 1 + (k - 1) * 0.5, k);
  });
  return (
    <group>
      <group ref={belly}>
        <Part geometry={ball} color={TEAL} at={[0, 0.37, -0.02]} scale={[0.43, 0.37, 0.37]} outline={0.02} />
        <Part geometry={ball} color={CREAM} at={[0, 0.33, 0.09]} scale={[0.35, 0.28, 0.3]} outline={0} />
      </group>
      {/* arms hanging wide, five small claws at each paw */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={ball} color={TEAL} at={[s * 0.43, 0.565, 0.03]} scale={[0.1, 0.2, 0.1]} turn={[0.2, 0, s * 0.85]} outline={0.015} />
          {[-2, -1, 0, 1, 2].map((k) => (
            <mesh
              key={k}
              geometry={cone}
              material={plain(CLAW)}
              position={[s * (0.57 + k * 0.004), 0.44 - Math.abs(k) * 0.008, 0.03 + k * 0.022]}
              rotation={[0, 0, -s * 2.4]}
              scale={[0.011, 0.028, 0.011]}
            />
          ))}
        </group>
      ))}
      {/* the big feet, soles out: cream with a brown pad and three claws round the rim */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.42, 0.15, 0.22]} rotation={[-0.3, s * 0.3, -s * 0.35]}>
          <Part geometry={ball} color={CREAM} scale={[0.135, 0.145, 0.09]} outline={0.012} />
          <mesh geometry={ball} material={plain(PAD)} position={[-s * 0.01, -0.04, 0.085]} scale={[0.065, 0.06, 0.02]} />
          {FOOT_CLAWS.map((deg) => {
            const a = ((s > 0 ? deg : 180 - deg) * Math.PI) / 180;
            return (
              <mesh
                key={deg}
                geometry={cone}
                material={plain(CLAW)}
                position={[Math.cos(a) * 0.135, Math.sin(a) * 0.145, 0.05]}
                rotation={[0, 0, a - Math.PI / 2]}
                scale={[0.018, 0.045, 0.018]}
              />
            );
          })}
        </group>
      ))}
      {/* the head: teal, the cream mask over the lower face with a V notch, ears on the corners */}
      <Part geometry={ball} color={TEAL} at={[0, 0.78, 0.04]} scale={[0.25, 0.185, 0.21]} turn={[0.06, 0, 0]} outline={0.015} />
      <Part geometry={ball} color={CREAM} at={[0, 0.71, 0.09]} scale={[0.235, 0.15, 0.17]} outline={0} />
      <mesh geometry={notch} material={plain(TEAL)} position={[0, 0.805, 0.22]} rotation={[-0.2, 0, 0]} />
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={cone} color={TEAL} at={[s * 0.2, 0.955, 0.03]} scale={[0.065, 0.1, 0.05]} turn={[0, 0, -s * 0.3]} outline={0.01} />
          {/* closed eyes: gentle arcs on the cream */}
          <mesh geometry={closedEye} material={plain(DARK)} position={[s * 0.1, 0.565, 0.248]} rotation={[0, 0, Math.PI / 2 - 0.21]} />
          <mesh geometry={cone} material={plain(CLAW)} position={[s * 0.062, 0.656, 0.252]} scale={[0.012, 0.024, 0.008]} />
        </group>
      ))}
      <mesh geometry={ball} material={plain(DARK)} position={[0, 0.645, 0.25]} scale={[0.075, 0.006, 0.01]} />
    </group>
  );
}
