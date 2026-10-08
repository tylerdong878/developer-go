"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CapsuleGeometry, type Group, TorusGeometry } from "three";
import { ball, onBody, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Caterpie in GO's pose, from the art, HOME and GO's model (notes/research/species-1.md).
 * Height 1 is the top of the head. The big round head is the biggest part,
 * with huge eyes on its sides (yellow rings round black pupils) and the
 * red-orange Y antenna across the top. Two segments stand up under it with
 * cream belly lobes and stubby feet, the rest curl back along the ground,
 * each with a pale ring, ending in a cream teardrop tail.
 */

const GREEN = "#7cc95e";
const CREAM = "#f4e48c";
const RED = "#e0604a";
const DARK = "#1c1620";

const HEAD = [0, 0.74, 0.04] as const;
const HEAD_R = [0.25, 0.24, 0.24] as const;

/** A unit capsule (1 wide, 2 tall), for the antenna's rounded arms. */
const capsule = new CapsuleGeometry(0.5, 1, 4, 12);
const ring = new TorusGeometry(1, 0.14, 4, 18);

/** The body after the head, top to tail: center, radius, and its ring's size. */
const SEGMENTS: { at: [number, number, number]; r: [number, number, number]; ring: number }[] = [
  { at: [0, 0.45, -0.03], r: [0.17, 0.16, 0.16], ring: 0.06 },
  { at: [0, 0.27, -0.07], r: [0.15, 0.14, 0.15], ring: 0.05 },
  { at: [0, 0.12, -0.2], r: [0.11, 0.11, 0.11], ring: 0.04 },
  { at: [0, 0.09, -0.33], r: [0.09, 0.09, 0.09], ring: 0.03 },
  { at: [0, 0.08, -0.44], r: [0.075, 0.075, 0.075], ring: 0.025 },
];
/** Cream belly lobes on the front of the first three, each with a pair of stubby feet. */
const BELLY: { at: [number, number, number]; r: [number, number, number]; foot: [number, number, number]; fr: number }[] = [
  { at: [0, 0.46, 0.08], r: [0.13, 0.13, 0.1], foot: [0.11, 0.48, 0.14], fr: 0.045 },
  { at: [0, 0.29, 0.05], r: [0.12, 0.12, 0.1], foot: [0.11, 0.32, 0.12], fr: 0.043 },
  { at: [0, 0.14, -0.08], r: [0.09, 0.08, 0.09], foot: [0.09, 0.16, 0.06], fr: 0.04 },
];

/** A huge side eye: a yellow ring round a big black pupil, with a glint toward the front. */
function SideEye({ s }: { s: -1 | 1 }) {
  const { at, turn } = onBody(HEAD, HEAD_R, s * 1.12, 0.17, 0.004);
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
      <mesh geometry={ball} material={plain("#ffe060")} scale={[0.085, 0.11, 0.02]} />
      <mesh geometry={ball} material={plain(DARK)} position={[0, -0.004, 0.01]} scale={[0.062, 0.082, 0.018]} />
      <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.022, 0.04, 0.024]} scale={0.017} />
    </group>
  );
}

export function Caterpie({ seed = 0 }: ModelProps) {
  const chain = useRef<Group>(null);
  const antenna = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a slow sway with a wave running down the body, the head bobbing on top
    chain.current?.children.forEach((g, i) => {
      g.position.x = Math.sin(t * 2.5 - i * 0.6) * 0.015;
      if (i === 0) g.position.y = Math.sin(t * 2) * 0.01;
    });
    // the antenna twitches now and then
    if (antenna.current) antenna.current.rotation.z = t % 3.7 < 0.3 ? Math.sin(t * 40) * 0.08 : 0;
  });
  return (
    <group ref={chain}>
      {/* the head with its muzzle, mouth, eyes and the Y antenna */}
      <group>
        <Part geometry={ball} color={GREEN} at={HEAD} scale={HEAD_R} outline={0.012} />
        <Part geometry={ball} color={GREEN} at={[0, 0.63, 0.2]} scale={[0.12, 0.1, 0.1]} outline={0.008} />
        <mesh geometry={ball} material={plain(DARK)} position={[0, 0.55, 0.17]} scale={[0.07, 0.025, 0.045]} />
        {([-1, 1] as const).map((s) => (
          <SideEye key={s} s={s} />
        ))}
        <group ref={antenna} position={[0, 0.93, 0.12]}>
          <Part geometry={capsule} color={RED} scale={[0.05, 0.06, 0.05]} turn={[0.4, 0, 0]} outline={0.012} />
          {([-1, 1] as const).map((s) => (
            <Part
              key={s}
              geometry={capsule}
              color={RED}
              at={[s * 0.1, 0.05, 0.02]}
              scale={[0.05, 0.1, 0.05]}
              turn={[0, 0, -s * (Math.PI / 2 - 0.26)]}
              outline={0.012}
            />
          ))}
        </group>
      </group>
      {/* the segments, shrinking to the tail, each with a pale ring on both sides */}
      {SEGMENTS.map((seg, i) => (
        <group key={i}>
          <Part geometry={ball} color={GREEN} at={seg.at} scale={seg.r} outline={i < 2 ? 0.01 : 0.008} />
          {([-1, 1] as const).map((s) => (
            <mesh
              key={s}
              geometry={ring}
              material={plain("#ecea98")}
              position={[s * (seg.r[0] + 0.002), seg.at[1] + 0.01, seg.at[2]]}
              rotation={[0, Math.PI / 2, 0]}
              scale={seg.ring}
            />
          ))}
          {BELLY[i] ? (
            <>
              <Part geometry={ball} color={CREAM} at={BELLY[i].at} scale={BELLY[i].r} outline={0} />
              {([-1, 1] as const).map((s) => (
                <Part
                  key={s}
                  geometry={ball}
                  color={CREAM}
                  at={[s * BELLY[i].foot[0], BELLY[i].foot[1], BELLY[i].foot[2]]}
                  scale={[BELLY[i].fr, BELLY[i].fr, BELLY[i].fr]}
                  outline={0.006}
                />
              ))}
            </>
          ) : null}
          {i === SEGMENTS.length - 1 ? (
            <>
              <Part geometry={ball} color={CREAM} at={[0, 0.13, -0.51]} scale={[0.03, 0.03, 0.03]} outline={0.005} />
              <Part geometry={ball} color={CREAM} at={[0, 0.24, -0.54]} scale={[0.038, 0.11, 0.038]} turn={[-0.2, 0, 0]} outline={0.006} />
            </>
          ) : null}
        </group>
      ))}
    </group>
  );
}
