"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, TorusGeometry, Vector3 } from "three";
import { ball, cone, Eye, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Charmander, from the official art, HOME and GO (notes/research/species-1.md).
 * Height 1 is the top of the head to the soles. An egg-shaped head with a
 * muzzle, tall eyes with teal in the bottom, a wide smile with two fangs,
 * chunky thighs, three white claws per foot, and a thick tail that sweeps
 * back and curls up into a flame about as tall as the head.
 */

const ORANGE = "#f4883a";
const BELLY = "#f9de8e";
const DARK = "#1c1620";

/** The tail's center line from the hips back and up, with its radius at each point. */
const TAIL: [number, number, number, number][] = [
  [0.04, 0.17, -0.15, 0.075],
  [0.1, 0.15, -0.28, 0.065],
  [0.2, 0.2, -0.36, 0.055],
  [0.27, 0.32, -0.36, 0.045],
  [0.3, 0.45, -0.33, 0.037],
];
const tailCurve = new CatmullRomCurve3(TAIL.map(([x, y, z]) => new Vector3(x, y, z)));
const TAIL_BALLS = Array.from({ length: 23 }, (_, i) => {
  const k = i / 22;
  const p = tailCurve.getPoint(k);
  const at = Math.min(TAIL.length - 1.001, k * (TAIL.length - 1));
  const j = Math.floor(at);
  const r = TAIL[j][3] + (TAIL[j + 1][3] - TAIL[j][3]) * (at - j);
  return { p: [p.x, p.y, p.z] as [number, number, number], r };
});
const TIP = TAIL[TAIL.length - 1];
const smile = new TorusGeometry(0.105, 0.005, 4, 16, 2.2);

/** The tail flame: a yellow bulb, an orange body, a red tip and two side licks, unlit and flickering. */
function Flame({ seed }: { seed: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 10 + seed;
    g.current?.scale.set(1 + Math.sin(t * 1.3) * 0.08, 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.7) * 0.05, 1 + Math.cos(t * 1.1) * 0.08);
  });
  return (
    <group ref={g}>
      <mesh geometry={ball} material={plain("#ffd23a")} position={[0, 0.07, 0]} scale={[0.06, 0.07, 0.06]} />
      <mesh geometry={ball} material={plain("#ff8a1a")} position={[0, 0.1, 0]} scale={[0.08, 0.075, 0.08]} />
      <mesh geometry={cone} material={plain("#ff8a1a")} position={[0, 0.2, 0]} scale={[0.085, 0.22, 0.085]} />
      <mesh geometry={cone} material={plain("#ff4a1a")} position={[0, 0.28, 0]} scale={[0.05, 0.16, 0.05]} />
      {([-1, 1] as const).map((s) => (
        <mesh key={s} geometry={cone} material={plain("#ff4a1a")} position={[s * 0.05, 0.22, 0]} rotation={[0, 0, -s * 0.5]} scale={[0.025, 0.08, 0.025]} />
      ))}
    </group>
  );
}

export function Charmander({ seed = 0 }: ModelProps) {
  const tail = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 6.3 + seed) * 0.2;
  });
  return (
    <group>
      {/* body: torso with the yellow belly, a short neck, the egg head with its muzzle */}
      <Part geometry={ball} color={ORANGE} at={[0, 0.33, 0]} scale={[0.18, 0.26, 0.17]} outline={0.012} />
      <Part geometry={ball} color={BELLY} at={[0, 0.36, 0.06]} scale={[0.145, 0.21, 0.13]} outline={0} />
      <Part geometry={ball} color={ORANGE} at={[0, 0.58, 0.02]} scale={[0.14, 0.08, 0.13]} outline={0.01} />
      <Part geometry={ball} color={ORANGE} at={[0, 0.79, 0.05]} scale={[0.175, 0.205, 0.17]} outline={0.012} />
      <Part geometry={ball} color={ORANGE} at={[0, 0.68, 0.12]} scale={[0.13, 0.085, 0.11]} turn={[0.15, 0, 0]} outline={0} />
      {/* thighs and feet with three white claws each, arms out and down */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={ball} color={ORANGE} at={[s * 0.14, 0.15, 0]} scale={[0.09, 0.11, 0.1]} turn={[0, 0, s * 0.15]} outline={0.01} />
          <group position={[s * 0.17, 0.035, 0.06]} rotation={[0, s * 0.3, 0]}>
            <Part geometry={ball} color={ORANGE} scale={[0.07, 0.035, 0.1]} outline={0.008} />
            {[-0.035, 0, 0.035].map((x) => (
              <mesh key={x} geometry={cone} material={plain("#f4f4f6")} position={[x, 0.01, 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={[0.012, 0.035, 0.012]} />
            ))}
          </group>
          <Part geometry={ball} color={ORANGE} at={[s * 0.2, 0.47, 0.05]} scale={[0.04, 0.11, 0.045]} turn={[0.2, 0, s * 0.9]} outline={0.008} />
        </group>
      ))}
      {/* the thick tail, sweeping back and curling up, with its flame */}
      <group ref={tail} position={[TAIL[0][0], TAIL[0][1], TAIL[0][2]]}>
        {TAIL_BALLS.map(({ p, r }, i) => (
          <Part key={i} geometry={ball} color={ORANGE} at={[p[0] - TAIL[0][0], p[1] - TAIL[0][1], p[2] - TAIL[0][2]]} scale={[r, r, r]} outline={0.008} />
        ))}
        <group position={[TIP[0] - TAIL[0][0], TIP[1] - TAIL[0][1], TIP[2] - TAIL[0][2]]}>
          <group scale={1.3}>
            <Flame seed={seed} />
          </group>
        </group>
      </group>
      {/* face: tall eyes with teal in the bottom and a tall inner glint, brows, nostrils, a wide smile and fangs */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Eye geometry={ball} at={[s * 0.125, 0.8, 0.18]} size={0.072} turn={[0, s * 0.75, 0]} side={s} aspect={0.5} iris="#1a7f9a" band glint={[1.1, 0.3]} glintSize={0.34} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * 0.11, 0.89, 0.19]} rotation={[0, s * 0.7, s * 0.3]} scale={[0.035, 0.006, 0.01]} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * 0.03, 0.69, 0.23]} scale={[0.008, 0.006, 0.005]} />
          <mesh geometry={cone} material={plain("#ffffff")} position={[s * 0.075, 0.655, 0.215]} rotation={[Math.PI, 0, 0]} scale={[0.01, 0.018, 0.008]} />
        </group>
      ))}
      <mesh geometry={smile} material={plain(DARK)} position={[0, 0.74, 0.205]} rotation={[0, 0, -Math.PI / 2 - 1.1]} />
    </group>
  );
}
