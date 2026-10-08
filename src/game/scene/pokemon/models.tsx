"use client";

import { useFrame } from "@react-three/fiber";
import { type ComponentType, useRef } from "react";
import type { Group } from "three";
import { ball, cone, Eye, half, Part, plain } from "./kit";
import { Charmander } from "./species/Charmander";
import { Bulbasaur } from "./species/Bulbasaur";
import { Pikachu } from "./species/Pikachu";
import { Squirtle } from "./species/Squirtle";
import type { ModelProps } from "./types";

/**
 * Pokémon modeled in code, part by part, from the official artwork, HOME
 * renders and GO's own poses (measurements in notes/research/species-*.md).
 * Each one stands 1 unit tall with its feet at y = 0 and faces +z; the map
 * scales it to the right size and turns it to face you. Rebuilt species
 * live in ./species, one file each.
 */
export type { ModelProps } from "./types";

/** Snorlax: a huge pear-shaped body, cream belly and face, eyes shut, fangs peeking up. */
function Snorlax({ asleep = true }: ModelProps) {
  const belly = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // slow, deep breathing while it naps
    const k = 1 + Math.sin(t * (asleep ? 1.2 : 2)) * 0.025;
    belly.current?.scale.set(k, 1 + (k - 1) * 0.5, k);
  });
  const TEAL = "#3e6b7b";
  const CREAM = "#ede1c8";
  return (
    <group>
      <group ref={belly}>
        <Part geometry={ball} color={TEAL} at={[0, 0.36, 0]} scale={[0.47, 0.37, 0.4]} outline={0.02} />
        <Part geometry={ball} color={CREAM} at={[0, 0.34, 0.11]} scale={[0.39, 0.31, 0.32]} outline={0} />
      </group>
      {/* arms resting on the belly */}
      {[-1, 1].map((s) => (
        <Part key={s} geometry={ball} color={TEAL} at={[s * 0.4, 0.42, 0.12]} scale={[0.1, 0.17, 0.1]} turn={[0.4, 0, s * 0.7]} outline={0.015} />
      ))}
      {/* head with the cream face mask, ears on top */}
      <Part geometry={ball} color={TEAL} at={[0, 0.78, 0.03]} scale={[0.25, 0.2, 0.22]} outline={0.015} />
      <Part geometry={ball} color={CREAM} at={[0, 0.74, 0.12]} scale={[0.19, 0.13, 0.13]} outline={0} />
      {[-1, 1].map((s) => (
        <Part key={s} geometry={cone} color={TEAL} at={[s * 0.15, 0.97, 0.02]} scale={[0.06, 0.1, 0.05]} turn={[0, 0, -s * 0.35]} outline={0.01} />
      ))}
      <Eye geometry={ball} at={[-0.075, 0.78, 0.24]} size={0.03} closed />
      <Eye geometry={ball} at={[0.075, 0.78, 0.24]} size={0.03} closed />
      {/* mouth and the two little fangs */}
      <mesh geometry={ball} position={[0, 0.71, 0.245]} scale={[0.07, 0.012, 0.02]}>
        <meshBasicMaterial color="#1c1620" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cone} position={[s * 0.045, 0.725, 0.248]} scale={[0.013, 0.025, 0.01]}>
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* the big cream feet with brown pads and claws */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.25, 0.09, 0.3]} rotation={[-0.3, s * 0.25, 0]}>
          <Part geometry={ball} color={CREAM} scale={[0.13, 0.11, 0.06]} outline={0.012} />
          <Part geometry={ball} color="#b4875a" at={[0, -0.01, 0.05]} scale={[0.07, 0.06, 0.02]} outline={0} />
          {[-1, 0, 1].map((c) => (
            <mesh key={c} geometry={cone} position={[c * 0.06, 0.1, 0.03]} scale={[0.02, 0.04, 0.02]}>
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Voltorb: a Poké Ball that glares back. Red on top, white below, angry eyes. */
function Voltorb({ seed = 0 }: ModelProps) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 7 + seed) * 0.05;
  });
  return (
    <group ref={g} position={[0, 0.5, 0]}>
      <Part geometry={half} color="#e03b30" scale={[0.5, 0.5, 0.5]} outline={0.015} />
      <Part geometry={half} color="#f4f4f2" scale={[0.5, 0.5, 0.5]} turn={[Math.PI, 0, 0]} outline={0.015} />
      <mesh geometry={ball} scale={[0.505, 0.02, 0.505]} material={plain("#1c1620")} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.15, 0.12, 0.44]} rotation={[0, s * 0.3, -s * 0.35]}>
          <mesh geometry={ball} scale={[0.09, 0.05, 0.04]} material={plain("#ffffff")} />
          <mesh geometry={ball} position={[s * -0.02, -0.005, 0.02]} scale={[0.035, 0.035, 0.03]} material={plain("#1c1620")} />
        </group>
      ))}
    </group>
  );
}

/** Jigglypuff: one round pink body, huge teal eyes, a forehead curl, little ears. */
function Jigglypuff({ seed = 0 }: ModelProps) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const k = Math.sin(clock.elapsedTime * 2.2 + seed) * 0.04;
    g.current?.scale.set(1 + k, 1 - k, 1 + k);
  });
  const PINK = "#f7a9c4";
  return (
    <group ref={g}>
      <Part geometry={ball} color={PINK} at={[0, 0.46, 0]} scale={[0.4, 0.38, 0.38]} outline={0.014} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Part geometry={cone} color={PINK} at={[s * 0.22, 0.86, 0]} scale={[0.09, 0.14, 0.05]} turn={[0, 0, -s * 0.45]} outline={0.008} />
          <Part geometry={ball} color={PINK} at={[s * 0.15, 0.08, 0.1]} scale={[0.08, 0.05, 0.1]} outline={0.008} />
          <Part geometry={ball} color={PINK} at={[s * 0.36, 0.42, 0.1]} scale={[0.05, 0.08, 0.05]} turn={[0, 0, s * 0.6]} outline={0.006} />
        </group>
      ))}
      <Part geometry={ball} color={PINK} at={[0, 0.85, 0.2]} scale={[0.07, 0.07, 0.07]} outline={0.006} />
      <Eye geometry={ball} at={[-0.14, 0.55, 0.33]} size={0.1} iris="#3fa6b7" />
      <Eye geometry={ball} at={[0.14, 0.55, 0.33]} size={0.1} iris="#3fa6b7" />
    </group>
  );
}

/** Which Pokémon have 3D models so far, by national dex number. The rest still use their sprite. */
export const POKEMON_3D: Record<number, ComponentType<ModelProps>> = {
  143: Snorlax,
  25: Pikachu,
  4: Charmander,
  7: Squirtle,
  1: Bulbasaur,
  100: Voltorb,
  39: Jigglypuff,
};
