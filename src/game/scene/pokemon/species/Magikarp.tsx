"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, CylinderGeometry, type Group, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { ball, cutout, onBody, outlineMaterial, Part, plain, toon } from "../kit";
import type { ModelProps } from "../types";

/*
 * Magikarp, from the art, HOME and GO's model (notes/research/species-1.md),
 * standing upright like the art. Height 1 is the dorsal fin's tip to the
 * whisker tips. A plump red-orange oval, the gaping pink "O" of a mouth,
 * blank white eyes with pinprick pupils, two long whiskers drooping to the
 * ground, a yellow three-point crown along the back, spiky yellow fins
 * underneath, and white pectoral and tail fins framed in red-orange.
 */

const RED = "#f2603a";
const YELLOW = "#f6d36a";
const WHITE = "#f4f2f2";
const RAY = "#b8b4b4";

const BODY = [0, 0.52, 0] as const;
const BODY_R = [0.17, 0.245, 0.31] as const;

/** Fins drawn side-on as (z, y) outlines, turned to stand along the body. */
const DORSAL: [number, number][] = [
  [0.08, 0.75],
  [0.03, 0.92],
  [-0.03, 0.8],
  [-0.17, 1.0],
  [-0.19, 0.82],
  [-0.27, 0.82],
  [-0.25, 0.74],
];
/** The tail, relative to where it joins the body (z -0.31, y 0.51). */
const TAIL_ROOT = [0, 0.51, -0.31] as const;
const TAIL: [number, number][] = [
  [-0.31, 0.6],
  [-0.45, 0.62],
  [-0.58, 0.59],
  [-0.52, 0.47],
  [-0.47, 0.33],
  [-0.38, 0.135],
  [-0.34, 0.28],
  [-0.31, 0.42],
].map(([z, y]) => [z - TAIL_ROOT[2], y - TAIL_ROOT[1]] as [number, number]);
/** The tail's red-orange top and bottom edges. */
const TAIL_EDGES: [[number, number], [number, number]][] = [
  [[-0.31, 0.6], [-0.45, 0.62]],
  [[-0.45, 0.62], [-0.58, 0.59]],
  [[-0.31, 0.42], [-0.34, 0.28]],
  [[-0.34, 0.28], [-0.38, 0.135]],
].map(([a, b]) => [[a[0] - TAIL_ROOT[2], a[1] - TAIL_ROOT[1]], [b[0] - TAIL_ROOT[2], b[1] - TAIL_ROOT[1]]] as [[number, number], [number, number]]);
const LOWER: [number, number][] = [
  [0.15, 0.09],
  [0.1, -0.09],
  [0.05, 0.02],
  [-0.02, -0.13],
  [-0.07, 0.0],
  [-0.14, -0.1],
  [-0.16, 0.09],
];
/** A pectoral fin from its root, sweeping back: a triangle with two gray rays. */
const PECTORAL: [number, number][] = [
  [0, 0.05],
  [-0.32, 0.0],
  [-0.22, -0.14],
  [0, -0.04],
];
const dorsal = cutout(DORSAL, 0.02);
const tail = cutout(TAIL, 0.02);
const lower = cutout(LOWER, 0.015);
const pectoral = cutout(PECTORAL, 0.012);
const rod = new CylinderGeometry(1, 1, 1, 8);
/** A unit ring (the lips): 1 across the middle of the tube, the tube 0.4 thick. */
const lips = new TorusGeometry(1, 0.4, 10, 24);

/** The two whiskers, hanging from the upper lip in a loose S to the ground. */
const whisker = (s: number) =>
  new CatmullRomCurve3(
    [
      [0.08, 0.53, 0.27],
      [0.1, 0.38, 0.3],
      [0.09, 0.22, 0.25],
      [0.11, 0.08, 0.28],
      [0.1, 0.012, 0.24],
    ].map(([x, y, z]) => new Vector3(s * x, y, z)),
  );
const WHISKERS = ([-1, 1] as const).map((s) => ({ s, tube: new TubeGeometry(whisker(s), 40, 0.012, 6), hull: new TubeGeometry(whisker(s), 40, 0.016, 6) }));

/** A thin rod between two points of a side-on (z, y) outline. */
function Edge({ a, b, r, color }: { a: [number, number]; b: [number, number]; r: number; color: string }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return (
    <mesh
      geometry={rod}
      material={toon(color)}
      position={[0, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2]}
      rotation={[Math.atan2(b[0] - a[0], b[1] - a[1]), 0, 0]}
      scale={[r, len, r]}
    />
  );
}

export function Magikarp({ seed = 0 }: ModelProps) {
  const body = useRef<Group>(null);
  const tailRef = useRef<Group>(null);
  const mouth = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // the tail flaps, the body wobbles, the mouth gapes in and out
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * Math.PI * 2 * 3) * 0.35;
    if (body.current) body.current.rotation.z = Math.sin(t * Math.PI * 2 * 1.5) * 0.08;
    mouth.current?.scale.setScalar(1 + Math.sin(t * Math.PI * 2 * 2) * 0.1);
  });
  return (
    <group>
      {/* the whiskers stay planted while the body wobbles above them */}
      {WHISKERS.map(({ s, tube, hull }) => (
        <group key={s}>
          <mesh geometry={tube} material={toon("#f2d478")} castShadow />
          <mesh geometry={hull} material={outlineMaterial} />
        </group>
      ))}
      <group ref={body} position={[0, 0.3, 0]}>
        <group position={[0, -0.3, 0]}>
          <Part geometry={ball} color={RED} at={BODY} scale={BODY_R} outline={0.012} />
          {/* the gaping mouth: a pink ring of lips round a dark inside */}
          <group ref={mouth} position={[0, 0.47, 0.29]}>
            <Part geometry={lips} color="#e87888" scale={[0.075, 0.09, 0.075]} outline={0.006} />
            <mesh geometry={ball} material={plain("#4a1e24")} scale={[0.058, 0.072, 0.03]} />
          </group>
          {/* blank white eyes, a pinprick pupil, no glint */}
          {([-1, 1] as const).map((s) => {
            const { at, turn } = onBody(BODY, BODY_R, s * 1.23, 0.29, 0.006);
            return (
              <group key={s} position={at as [number, number, number]} rotation={turn as [number, number, number]}>
                <Part geometry={ball} color="#ffffff" unlit scale={[0.068, 0.068, 0.014]} outline={0.004} />
                <mesh geometry={ball} material={plain("#1c1620")} position={[0, 0, 0.014]} scale={0.008} />
              </group>
            );
          })}
          {/* the yellow crown along the back, the spiky fins underneath */}
          <Part geometry={dorsal} color={YELLOW} turn={[0, -Math.PI / 2, 0]} outline={0.006} />
          {([-1, 1] as const).map((s) => (
            <group key={s} position={[s * 0.05, 0.24, -0.03]} rotation={[0, 0, s * 0.3]}>
              <Part geometry={lower} color={YELLOW} turn={[0, -Math.PI / 2, 0]} outline={0.006} />
            </group>
          ))}
          {/* white pectoral fins with a red-orange frame and gray rays, sweeping back and down */}
          {([-1, 1] as const).map((s) => (
            <group key={s} position={[s * 0.15, 0.5, 0.05]} rotation={[-0.2, -s * 0.4, 0]}>
              <group rotation={[0, -Math.PI / 2, 0]}>
                <Part geometry={pectoral} color={WHITE} outline={0.004} />
              </group>
              <Edge a={[0, 0.05]} b={[-0.32, 0]} r={0.012} color={RED} />
              <Edge a={[0, 0]} b={[-0.25, -0.06]} r={0.004} color={RAY} />
              <Edge a={[0, -0.02]} b={[-0.21, -0.12]} r={0.004} color={RAY} />
            </group>
          ))}
          {/* the big white tail fan, red-orange along its edges */}
          <group ref={tailRef} position={[...TAIL_ROOT]}>
            <group rotation={[0, -Math.PI / 2, 0]}>
              <Part geometry={tail} color={WHITE} outline={0.006} />
            </group>
            {TAIL_EDGES.map(([a, b], i) => (
              <Edge key={i} a={a} b={b} r={0.013} color={RED} />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
