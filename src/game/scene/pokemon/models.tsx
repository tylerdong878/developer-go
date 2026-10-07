"use client";

import { useFrame } from "@react-three/fiber";
import { type ComponentType, useMemo, useRef } from "react";
import { ConeGeometry, ExtrudeGeometry, type Group, Shape, SphereGeometry } from "three";
import { Eye, Part, toon } from "./kit";

/**
 * Pokémon modeled in code, part by part, from the official artwork's shapes
 * and colors. Each one stands 1 unit tall with its feet at y = 0 and faces
 * +z; the map scales it to the right size and turns it to face you.
 */
export type ModelProps = { asleep?: boolean; seed?: number };

const ball = new SphereGeometry(1, 28, 20);
const cone = new ConeGeometry(1, 1, 18);

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

/** Pikachu's tail: the lightning bolt, flat and thick, brown where it meets the body. */
function useBolt() {
  return useMemo(() => {
    const s = new Shape();
    // a zigzag bolt, drawn from the base upward
    s.moveTo(0, 0);
    s.lineTo(0.09, 0.02);
    s.lineTo(0.06, 0.14);
    s.lineTo(0.2, 0.18);
    s.lineTo(0.15, 0.32);
    s.lineTo(0.36, 0.38);
    s.lineTo(0.3, 0.56);
    s.lineTo(0.12, 0.42);
    s.lineTo(0.17, 0.3);
    s.lineTo(0.02, 0.24);
    s.lineTo(0.06, 0.12);
    s.lineTo(-0.04, 0.08);
    s.closePath();
    return new ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 }).translate(0, 0, -0.025);
  }, []);
}

/** Pikachu: yellow, black-tipped ears, red cheeks, brown back stripes, and the bolt tail. */
function Pikachu({ seed = 0 }: ModelProps) {
  const ears = useRef<Group>(null);
  const bolt = useBolt();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // the occasional ear twitch
    const twitch = Math.max(0, Math.sin(t * 0.9) - 0.92) * 6;
    if (ears.current) ears.current.rotation.z = Math.sin(t * 30) * 0.08 * twitch;
  });
  const YELLOW = "#f7d02c";
  return (
    <group>
      {/* body and feet */}
      <Part geometry={ball} color={YELLOW} at={[0, 0.27, 0]} scale={[0.2, 0.24, 0.17]} outline={0.012} />
      {[-1, 1].map((s) => (
        <Part key={s} geometry={ball} color={YELLOW} at={[s * 0.1, 0.04, 0.06]} scale={[0.07, 0.04, 0.09]} outline={0.008} />
      ))}
      {/* little arms */}
      {[-1, 1].map((s) => (
        <Part key={s} geometry={ball} color={YELLOW} at={[s * 0.15, 0.33, 0.1]} scale={[0.04, 0.07, 0.04]} turn={[0.6, 0, s * 0.5]} outline={0.006} />
      ))}
      {/* the two brown stripes on its back */}
      {[0.34, 0.25].map((y) => (
        <Part key={y} geometry={ball} color="#8c5a2b" at={[0, y, -0.155]} scale={[0.12, 0.022, 0.03]} outline={0} />
      ))}
      {/* the bolt tail, brown at the base */}
      <group position={[0.06, 0.1, -0.16]} rotation={[0.25, 0.4, -0.15]} scale={1.45}>
        <mesh geometry={bolt} material={toon(YELLOW)} castShadow />
        <Part geometry={ball} color="#8c5a2b" at={[0.03, 0.05, 0]} scale={[0.06, 0.06, 0.035]} outline={0} />
      </group>
      {/* head, a little wider than it is tall */}
      <Part geometry={ball} color={YELLOW} at={[0, 0.6, 0.02]} scale={[0.25, 0.215, 0.21]} outline={0.012} />
      <group ref={ears} position={[0, 0.7, 0]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.1, 0.03, 0]} rotation={[0, 0, -s * 0.42]}>
            <Part geometry={cone} color={YELLOW} at={[0, 0.2, 0]} scale={[0.065, 0.4, 0.045]} outline={0.008} />
            <Part geometry={cone} color="#1c1620" at={[0, 0.34, 0]} scale={[0.03, 0.12, 0.024]} outline={0} />
          </group>
        ))}
      </group>
      {/* face: eyes, red cheeks, tiny nose */}
      <Eye geometry={ball} at={[-0.09, 0.64, 0.2]} size={0.04} />
      <Eye geometry={ball} at={[0.09, 0.64, 0.2]} size={0.04} />
      {[-1, 1].map((s) => (
        <Part key={s} geometry={ball} color="#e24a3b" at={[s * 0.16, 0.55, 0.17]} scale={[0.05, 0.045, 0.02]} turn={[0, s * 0.6, 0]} outline={0} />
      ))}
      <mesh geometry={ball} position={[0, 0.6, 0.23]} scale={[0.01, 0.007, 0.006]}>
        <meshBasicMaterial color="#1c1620" />
      </mesh>
    </group>
  );
}

/** Which Pokémon have 3D models so far, by national dex number. The rest still use their sprite. */
export const POKEMON_3D: Record<number, ComponentType<ModelProps>> = {
  143: Snorlax,
  25: Pikachu,
};
