"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, SphereGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { ball, cone, ghost, onBody, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Poliwag in GO's pose, from the art, HOME and GO's model (notes/research/species-2.md).
 * Height 1 is the top of the ball. A sky-blue ball, a touch taller than
 * wide, with big glossy eyes at the very top, pink pouty lips, and the white
 * belly disc with its black spiral (2.75 turns, outer end at the lower left,
 * winding clockwise inward). Two stubby feet, no arms, and a thin tail rising
 * behind with a see-through fin round it.
 */

const BLUE = "#6198cf";
const BELLY = "#eef1f6";

const BODY = [0, 0.555, 0] as const;
const BODY_R = [0.43, 0.445, 0.42] as const;

/** The belly disc's center, 22 degrees below the front, and the two directions across it (right, up). */
const DOWN = 0.38;
const C = new Vector3(0, -Math.sin(DOWN), Math.cos(DOWN));
const U = new Vector3(1, 0, 0);
const V = new Vector3(0, Math.cos(DOWN), Math.sin(DOWN));
/** How far the disc reaches round the ball from its center (radians). */
const CAP = 0.64;

/** A point on the body's surface, `a` radians out from the disc's center at `az` round it, lifted by `k`. */
function onDisc(a: number, az: number, k: number) {
  const d = C.clone()
    .multiplyScalar(Math.cos(a))
    .add(U.clone().multiplyScalar(Math.sin(a) * Math.cos(az)))
    .add(V.clone().multiplyScalar(Math.sin(a) * Math.sin(az)));
  return new Vector3(d.x * BODY_R[0] * k, d.y * BODY_R[1] * k + BODY[1], d.z * BODY_R[2] * k);
}

/** The disc: a round cap of a ball turned to face down-front, stretched onto the body. */
const disc = new SphereGeometry(1, 36, 10, 0, Math.PI * 2, 0, CAP).rotateX(Math.PI / 2 + DOWN);
const spiral = new TubeGeometry(
  new CatmullRomCurve3(
    Array.from({ length: 161 }, (_, i) => {
      const t = i / 160;
      return onDisc((0.03 + 0.82 * t) * CAP, -Math.PI / 4 + t * 2.75 * Math.PI * 2, 1.022);
    }),
  ),
  220,
  0.014,
  6,
);
/** Unit lips: a ring 1 across the middle of its tube. */
const lips = new TorusGeometry(1, 0.43, 8, 20);

export function Poliwag({ seed = 0 }: ModelProps) {
  const root = useRef<Group>(null);
  const tail = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // the tail swishes, the body leans the other way
    const swish = Math.sin(t * 5);
    if (tail.current) tail.current.rotation.z = -0.65 + swish * 0.25;
    if (root.current) root.current.rotation.z = -swish * 0.03;
  });
  return (
    <group ref={root}>
      {([-1, 1] as const).map((s) => (
        <Part key={s} geometry={ball} color={BLUE} at={[s * 0.19, 0.07, 0.12]} scale={[0.09, 0.07, 0.13]} turn={[0, s * 0.25, 0]} outline={0.008} />
      ))}
      <Part geometry={ball} color={BLUE} at={BODY} scale={BODY_R} outline={0.014} />
      {/* the belly disc and its spiral, both on the ball's surface */}
      <mesh geometry={disc} material={plain(BELLY)} position={[...BODY]} scale={[BODY_R[0] * 1.01, BODY_R[1] * 1.01, BODY_R[2] * 1.01]} />
      <mesh geometry={spiral} material={plain("#1e1c22")} />
      {/* pink pouty lips, puckered open the way GO shows them */}
      <Part geometry={lips} color="#f2b4cc" at={[0, 0.67, 0.425]} scale={[0.065, 0.049, 0.065]} turn={[-0.2, 0, 0]} outline={0.006} />
      <mesh geometry={ball} material={plain("#6a4448")} position={[0, 0.67, 0.43]} rotation={[-0.2, 0, 0]} scale={[0.05, 0.026, 0.02]} />
      {/* big glossy eyes up top: black irises pushed up, a white crescent under, highlights toward the middle */}
      {([-1, 1] as const).map((s) => {
        const { at, turn } = onBody(BODY, BODY_R, s * 0.505, 0.61, 0.012);
        return (
          <group key={s} position={at as [number, number, number]} rotation={turn as [number, number, number]}>
            <mesh geometry={ball} material={plain("#f4f4f6")} scale={[0.1, 0.11, 0.03]} />
            <mesh geometry={ball} material={plain("#1c1620")} position={[0, 0.014, 0.012]} scale={[0.082, 0.09, 0.03]} />
            <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.03, 0.045, 0.04]} scale={[0.03, 0.035, 0.01]} />
            <mesh geometry={ball} material={plain("#5a5a62")} position={[s * 0.02, -0.04, 0.04]} scale={[0.035, 0.018, 0.01]} />
          </group>
        );
      })}
      {/* the tail: a thin stem rising up, back and out, inside a see-through fin */}
      <group ref={tail} position={[0.06, 0.4, -0.36]} rotation={[-0.3, 0, -0.65]}>
        <Part geometry={cone} color="#4f83c1" at={[0, 0.33, 0]} scale={[0.018, 0.66, 0.018]} outline={0.004} />
        <mesh geometry={ball} material={ghost("#cfe6f4", 0.55)} position={[0, 0.36, 0]} scale={[0.165, 0.33, 0.01]} />
      </group>
    </group>
  );
}
