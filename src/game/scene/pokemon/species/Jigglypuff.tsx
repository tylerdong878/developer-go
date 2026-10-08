"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { ball, cone, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Jigglypuff, from the official art, HOME and GO (notes/research/species-2.md):
 * one soft baby-pink ball, big triangular ears with dark slate insides, a
 * thick lock of hair rolling forward over the brow into a counterclockwise
 * curl, and huge eyes set nearly at the sides: lots of white, a teal iris
 * with no pupil, a pale crescent at the bottom and one big highlight.
 */

const PINK = "#f4c4cf";
const C: [number, number, number] = [0, 0.51, 0];

const curl = new TubeGeometry(
  new CatmullRomCurve3(
    [
      [0.07, 0.94, 0.13],
      [-0.02, 0.92, 0.2],
      [-0.11, 0.86, 0.27],
      [-0.13, 0.76, 0.36],
      [-0.07, 0.68, 0.42],
      [0.04, 0.69, 0.42],
      [0.06, 0.76, 0.375],
      [-0.01, 0.775, 0.37],
    ].map(([x, y, z]) => new Vector3(x, y, z)),
  ),
  48,
  0.055,
  10,
);
const smile = new TorusGeometry(0.07, 0.006, 6, 16, 1.2);

/** Jigglypuff's eye: a thin dark rim, white, a teal iris shaded on top, a pale crescent, a highlight. */
function BigEye({ s }: { s: -1 | 1 }) {
  return (
    <group position={[s * 0.2, 0.53, 0.372]} rotation={[0, s * 0.5, 0]}>
      <mesh geometry={ball} material={plain("#4a3a44")} scale={[0.128, 0.136, 0.02]} />
      <mesh geometry={ball} material={plain("#f6f4f4")} position={[0, 0, 0.006]} scale={[0.12, 0.128, 0.02]} />
      <mesh geometry={ball} material={plain("#00788a")} position={[0, 0.012, 0.012]} scale={[0.096, 0.092, 0.02]} />
      <mesh geometry={ball} material={plain("#006478")} position={[0, 0.04, 0.016]} scale={[0.085, 0.055, 0.015]} />
      <mesh geometry={ball} material={plain("#6fbcc4")} position={[0, -0.05, 0.02]} scale={[0.06, 0.028, 0.01]} />
      <mesh geometry={ball} material={plain("#ffffff")} position={[0.038, 0.05, 0.024]} scale={[0.03, 0.038, 0.01]} />
    </group>
  );
}

export function Jigglypuff({ seed = 0 }: ModelProps) {
  const g = useRef<Group>(null);
  const arms = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a gentle squash and sway, arms flapping opposite
    const k = Math.sin(t * 2.2) * 0.04;
    g.current?.scale.set(1 + k, 1 - k, 1 + k);
    if (g.current) g.current.rotation.z = Math.sin(t * 1.8) * 0.07;
    if (arms.current) arms.current.rotation.z = -Math.sin(t * 1.8) * 0.07 + Math.sin(t * 3.6) * 0.05;
  });
  return (
    <group ref={g}>
      <Part geometry={ball} color={PINK} at={C} scale={[0.42, 0.42, 0.4]} outline={0.014} />
      {/* ears: big triangles leaning out, dark slate inside */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.37, 0.87, 0]} rotation={[0, 0, -s * 0.75]}>
          <Part geometry={cone} color={PINK} scale={[0.13, 0.26, 0.05]} outline={0.008} />
          <mesh geometry={cone} material={plain("#2f343e")} position={[0, 0.025, 0.042]} scale={[0.08, 0.16, 0.012]} />
        </group>
      ))}
      {/* the curl: a root, then a thick lock rolling forward over the brow */}
      <Part geometry={ball} color={PINK} at={[0.06, 0.9, 0.17]} scale={[0.09, 0.075, 0.08]} turn={[0.5, 0, 0]} outline={0.008} />
      <Part geometry={curl} color={PINK} outline={0.008} />
      <Part geometry={ball} color={PINK} at={[-0.01, 0.775, 0.37]} scale={[0.045, 0.045, 0.045]} outline={0} />
      <BigEye s={-1} />
      <BigEye s={1} />
      <mesh geometry={smile} material={plain("#433337")} position={[0, 0.47, 0.405]} rotation={[0, 0, -Math.PI / 2 - 0.6]} />
      {/* little arms out to the sides, feet on the ground */}
      <group ref={arms}>
        {([-1, 1] as const).map((s) => (
          <Part key={s} geometry={ball} color={PINK} at={[s * 0.36, 0.3, 0.17]} scale={[0.085, 0.06, 0.06]} turn={[0, -s * 0.5, -s * 0.3]} outline={0.006} />
        ))}
      </group>
      {([-1, 1] as const).map((s) => (
        <Part key={s} geometry={ball} color={PINK} at={[s * 0.17, 0.065, 0.14]} scale={[0.085, 0.065, 0.13]} turn={[0, s * 0.2, 0]} outline={0.008} />
      ))}
    </group>
  );
}
