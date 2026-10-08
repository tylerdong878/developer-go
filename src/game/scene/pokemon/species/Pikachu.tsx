"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, TorusGeometry } from "three";
import { ball, cutout, Eye, lathe, Part, plain, toon } from "../kit";
import type { ModelProps } from "../types";

/*
 * Pikachu, from the official art, the HOME render and GO's standing pose
 * (notes/research/species-1.md). Height 1 is ear tip to soles. The head and
 * body are one neckless pear, wider at the hips than the head; leaf-shaped
 * ears with black tips; cheeks out on the sides; a "w" cat mouth; two brown
 * stripes high on the back; and the flat bolt tail ending in a broad flag.
 */

const YELLOW = "#f7d02c";
const BROWN = "#8c5a2b";
const DARK = "#1c1620";

const body = lathe([
  [0, 0.03], [0.15, 0.035], [0.21, 0.06], [0.24, 0.1], [0.25, 0.14], [0.245, 0.2], [0.232, 0.27], [0.215, 0.34],
  [0.205, 0.4], [0.21, 0.46], [0.215, 0.52], [0.205, 0.6], [0.185, 0.666], [0.15, 0.7], [0.09, 0.735], [0, 0.764],
]);
const ear = lathe([[0.035, 0], [0.05, 0.065], [0.053, 0.11], [0.046, 0.185], [0.03, 0.25], [0.012, 0.305], [0, 0.34]], 16, 24);
const earTip = lathe([[0.039, 0.205], [0.03, 0.25], [0.012, 0.305], [0, 0.34]], 16, 12);
/** The bolt's outline, traced from the HOME render (base at the origin, +x outward, +y up). */
const tail = cutout(
  [[0.032, 0.008], [0.132, 0.038], [0.088, 0.089], [0.224, 0.17], [0.16, 0.272], [0.409, 0.35], [0.441, 0.546], [0.021, 0.315], [0.118, 0.19], [0.007, 0.109], [-0.025, 0.033]],
  0.03,
);
const tailBase = cutout(
  [[-0.025, 0.033], [0.032, 0.008], [0.132, 0.038], [0.112, 0.075], [0.095, 0.058], [0.08, 0.09], [0.062, 0.066], [0.042, 0.094], [0.026, 0.068], [0.006, 0.088]],
  0.034,
);
const smile = new TorusGeometry(0.018, 0.0035, 4, 10, Math.PI);

export function Pikachu({ seed = 0 }: ModelProps) {
  const root = useRef<Group>(null);
  const tailRef = useRef<Group>(null);
  const earL = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // breathing, a tail sway, and now and then one ear flicks back
    root.current?.scale.set(1, 1 + Math.sin(t * 9.4) * 0.012, 1);
    if (tailRef.current) tailRef.current.rotation.z = -0.1 + Math.sin(t * 7.5) * 0.08;
    const flick = Math.max(0, Math.sin(t * 1.3) - 0.95) * 20;
    if (earL.current) earL.current.rotation.x = -0.15 - flick * 0.25;
  });
  return (
    <group ref={root}>
      <Part geometry={body} color={YELLOW} scale={[1, 1, 0.88]} outline={0.012} />
      {/* ears: leaf-shaped, tilted out, black on the top 40% */}
      {([-1, 1] as const).map((s) => (
        <group key={s} ref={s === -1 ? earL : undefined} position={[s * 0.12, 0.69, -0.01]} rotation={[-0.15, 0, -s * 0.5]}>
          <Part geometry={ear} color={YELLOW} scale={[1, 1, 0.45]} outline={0.008} />
          <mesh geometry={earTip} material={toon(DARK)} scale={[1.06, 1, 0.5]} />
        </group>
      ))}
      {/* arms down the front of the belly, feet poking forward */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={ball} color={YELLOW} at={[s * 0.135, 0.36, 0.15]} scale={[0.04, 0.09, 0.045]} turn={[0.5, 0, s * 0.3]} outline={0.006} />
          <Part geometry={ball} color={YELLOW} at={[s * 0.13, 0.03, 0.08]} scale={[0.06, 0.035, 0.085]} turn={[0, s * 0.2, 0]} outline={0.008} />
        </group>
      ))}
      {/* the two brown stripes, high on the back */}
      <Part geometry={ball} color={BROWN} at={[0, 0.43, -0.172]} scale={[0.1, 0.02, 0.03]} outline={0} />
      <Part geometry={ball} color={BROWN} at={[0, 0.3, -0.19]} scale={[0.09, 0.02, 0.03]} outline={0} />
      {/* the bolt tail, out to its left with the flag up, brown at the base */}
      <group ref={tailRef} position={[0.07, 0.18, -0.18]} rotation={[0.15, -0.35, -0.1]}>
        <Part geometry={tail} color={YELLOW} outline={0.006} />
        <mesh geometry={tailBase} material={toon(BROWN)} />
      </group>
      {/* face: dark eyes with the glint on the inner side, coral cheeks out on the sides, nose, "w" mouth */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Eye geometry={ball} at={[s * 0.105, 0.655, 0.135]} size={0.04} turn={[0, s * 0.6, 0]} side={s} aspect={0.85} glint={[0.47, 0.43]} />
          <Part geometry={ball} color="#ee5a42" at={[s * 0.18, 0.53, 0.1]} scale={[0.06, 0.06, 0.018]} turn={[0, s * 1.0, 0]} outline={0} />
          <mesh geometry={smile} material={plain(DARK)} position={[s * 0.018, 0.59, 0.181]} rotation={[0, 0, Math.PI]} />
        </group>
      ))}
      <mesh geometry={ball} material={plain(DARK)} position={[0, 0.62, 0.176]} scale={[0.012, 0.008, 0.006]} />
    </group>
  );
}
