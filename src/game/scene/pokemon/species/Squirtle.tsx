"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { ball, Eye, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Squirtle, from the official art, HOME and GO (notes/research/species-1.md).
 * Height 1 is the top of the head to the soles. A round head with a snout
 * and a wide smile, big eyes with a maroon band at the bottom, a brown
 * carapace whose white rim runs round its edge as a vertical loop, the cream
 * plastron with its seams, and a fat spiral tail curl behind.
 */

const BLUE = "#74c6e8";
const DARK = "#1c1620";
const SEAM = "#7a5a30";

const rim = new TorusGeometry(1, 0.12, 6, 40);
const spiralOuter = new TorusGeometry(0.075, 0.005, 4, 18, 1.5 * Math.PI);
const spiralInner = new TorusGeometry(0.035, 0.005, 4, 12, 1.5 * Math.PI);
const smile = new TorusGeometry(0.13, 0.005, 4, 18, 1.9);

/** The plastron: an ellipsoid at [0, 0.4, 0.05] with radii [0.18, 0.24, 0.15]. */
const PLASTRON = { c: [0, 0.4, 0.05], r: [0.18, 0.24, 0.15] } as const;
/** A point on the plastron's front surface at (x, y), lifted a hair so seams sit on top. */
const onPlastron = (x: number, y: number) => {
  const u = (x - PLASTRON.c[0]) / PLASTRON.r[0];
  const v = (y - PLASTRON.c[1]) / PLASTRON.r[1];
  return new Vector3(x, y, PLASTRON.c[2] + (PLASTRON.r[2] + 0.003) * Math.sqrt(Math.max(0, 1 - u * u - v * v)));
};
/** The seams on the plastron, as lines from one point to another, bent to hug its curve. */
const SEAMS = (
  [
    [[-0.1, 0.54], [0.1, 0.54]],
    [[-0.13, 0.37], [0.13, 0.37]],
    [[0, 0.54], [0, 0.21]],
    [[-0.12, 0.54], [-0.1, 0.21]],
    [[0.12, 0.54], [0.1, 0.21]],
  ] as const
).map(([[x0, y0], [x1, y1]]) => {
  const points = Array.from({ length: 9 }, (_, i) => onPlastron(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8));
  return new TubeGeometry(new CatmullRomCurve3(points), 16, 0.004, 4);
});

export function Squirtle({ seed = 0 }: ModelProps) {
  const tail = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 3 + seed) * 0.25;
  });
  return (
    <group>
      {/* legs and feet, the torso, then the shell: brown carapace, cream plastron, white rim */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={ball} color={BLUE} at={[s * 0.14, 0.13, 0.02]} scale={[0.085, 0.12, 0.09]} outline={0.01} />
          <Part geometry={ball} color={BLUE} at={[s * 0.15, 0.03, 0.06]} scale={[0.08, 0.035, 0.1]} turn={[0, s * 0.2, 0]} outline={0.008} />
          <Part geometry={ball} color={BLUE} at={[s * 0.2, 0.52, 0.06]} scale={[0.055, 0.12, 0.055]} turn={[0.4, 0, s * 1.0]} outline={0.008} />
        </group>
      ))}
      <Part geometry={ball} color={BLUE} at={[0, 0.4, 0]} scale={[0.19, 0.25, 0.18]} outline={0.01} />
      <Part geometry={ball} color="#a0663a" at={[0, 0.43, -0.07]} scale={[0.215, 0.29, 0.2]} turn={[-0.1, 0, 0]} outline={0.012} />
      <Part geometry={ball} color="#f3e0a8" at={PLASTRON.c} scale={PLASTRON.r} outline={0.01} />
      <mesh geometry={rim} material={plain("#e8eaee")} position={[0, 0.41, 0]} scale={[0.205, 0.265, 0.2]} />
      {SEAMS.map((g, i) => (
        <mesh key={i} geometry={g} material={plain(SEAM)} />
      ))}
      {/* the tail: a root, then a fat disc curl with the spiral drawn on both sides */}
      <group ref={tail} position={[0, 0.17, -0.2]}>
        <Part geometry={ball} color={BLUE} at={[0, 0, -0.04]} scale={[0.07, 0.06, 0.1]} turn={[-0.3, 0, 0]} outline={0.008} />
        <Part geometry={ball} color={BLUE} at={[0, 0.06, -0.18]} scale={[0.055, 0.145, 0.145]} outline={0.01} />
        {([-1, 1] as const).map((s) => (
          <group key={s} position={[s * 0.056, 0.06, -0.18]} rotation={[0, Math.PI / 2, 0]}>
            <mesh geometry={spiralOuter} material={plain("#3a8fb0")} />
            <mesh geometry={spiralInner} material={plain("#3a8fb0")} rotation={[0, 0, Math.PI]} />
          </group>
        ))}
      </group>
      {/* the head and snout, then the face */}
      <Part geometry={ball} color={BLUE} at={[0, 0.81, 0.02]} scale={[0.215, 0.19, 0.2]} outline={0.012} />
      <Part geometry={ball} color={BLUE} at={[0, 0.75, 0.1]} scale={[0.14, 0.065, 0.13]} outline={0} />
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Eye geometry={ball} at={[s * 0.111, 0.85, 0.186]} size={0.075} turn={[-0.1, s * 0.55, 0]} side={s} aspect={0.7} iris="#8e2f55" band glint={[-0.1, 0.42]} glintSize={0.3} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * 0.1, 0.94, 0.18]} rotation={[0, s * 0.5, -s * 0.2]} scale={[0.03, 0.005, 0.01]} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * 0.025, 0.765, 0.226]} scale={[0.007, 0.005, 0.005]} />
        </group>
      ))}
      <mesh geometry={smile} material={plain(DARK)} position={[0, 0.855, 0.205]} rotation={[0, 0, -Math.PI / 2 - 0.95]} />
    </group>
  );
}
