"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { ball, cone, Eye, onBody, Part } from "../kit";
import type { ModelProps } from "../types";

/*
 * Weedle, from the art, HOME and GO's model (notes/research/species-1.md).
 * Height 1 is the horn tip. A big round tan head with a white horn on top,
 * a huge pink nose, tiny black dot eyes up beside it, then eight shrinking
 * segments curving back along the ground and off to one side, a pair of
 * pink bumps on each, and a silver stinger hooking up at the end.
 */

const TAN = "#b88c5a";
const PINK = "#e0609a";
const SILVER = "#e8ecee";

const HEAD_R = [0.215, 0.205, 0.2] as const;

/** The body after the head: center and radius, top to tail (the tail curls toward +x so it shows from the front). */
const SEGMENTS: [number, number, number, number][] = [
  [0, 0.4, -0.04, 0.135],
  [0, 0.27, -0.09, 0.117],
  [0, 0.16, -0.15, 0.102],
  [0, 0.09, -0.24, 0.09],
  [0.02, 0.08, -0.33, 0.08],
  [0.05, 0.075, -0.41, 0.075],
  [0.09, 0.07, -0.48, 0.07],
  [0.14, 0.065, -0.53, 0.065],
];

export function Weedle({ seed = 0 }: ModelProps) {
  const chain = useRef<Group>(null);
  const head = useRef<Group>(null);
  const stinger = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a slow wriggle down the body, the head tilting up and down, the stinger flicking now and then
    chain.current?.children.forEach((g, i) => (g.position.x = Math.sin(t * 2.5 - i * 0.6) * 0.012));
    if (head.current) head.current.rotation.x = Math.sin(t * Math.PI * 2 * 0.5) * 0.08;
    if (stinger.current) stinger.current.rotation.x = -0.2 + (t % 5.1 < 0.35 ? Math.sin((t % 5.1) * Math.PI * 6) * 0.3 : 0);
  });
  return (
    <group ref={chain}>
      {/* the head: horn, the huge pink nose, tiny dot eyes */}
      <group position={[0, 0.67, 0.04]}>
        <group ref={head}>
          <Part geometry={ball} color={TAN} scale={HEAD_R} outline={0.012} />
          <Part geometry={cone} color={SILVER} at={[0, 0.24, -0.07]} scale={[0.05, 0.18, 0.05]} turn={[-0.3, 0, 0]} outline={0.008} />
          <Part geometry={ball} color="#e86a9e" at={[0, -0.01, 0.17]} scale={[0.1, 0.075, 0.07]} turn={[-0.15, 0, 0]} outline={0.008} />
          {([-1, 1] as const).map((s) => {
            const { at, turn } = onBody([0, 0, 0], HEAD_R, s * 0.6, 0.27, 0.004);
            return <Eye key={s} geometry={ball} at={at} turn={turn} size={0.028} side={s} aspect={0.9} glint={[0.2, 0.35]} glintSize={0.35} />;
          })}
        </group>
      </group>
      {/* the segments, each with a pair of pink bumps low on its sides */}
      {SEGMENTS.map(([x, y, z, r], i) => (
        <group key={i}>
          <Part geometry={ball} color={TAN} at={[x, y, z]} scale={[r, r * 0.96, r]} outline={i < 3 ? 0.01 : 0.008} />
          {([-1, 1] as const).map((s) => {
            const b = 0.045 - (i / (SEGMENTS.length - 1)) * 0.015;
            return <Part key={s} geometry={ball} color={PINK} at={[x + s * r * 0.85, y - r * 0.3, z + r * 0.3]} scale={[b, b, b]} outline={0.004} />;
          })}
        </group>
      ))}
      {/* the stinger: a silver hook bending back at the tip */}
      <group>
        <group ref={stinger} position={[0.14, 0.12, -0.53]} rotation={[-0.2, 0, -0.2]}>
          <Part geometry={ball} color={SILVER} at={[0, 0.04, 0]} scale={[0.038, 0.06, 0.038]} outline={0.006} />
          <group position={[0, 0.08, 0]} rotation={[-0.6, 0, 0]}>
            <Part geometry={cone} color={SILVER} at={[0, 0.04, 0]} scale={[0.03, 0.1, 0.03]} outline={0.005} />
          </group>
        </group>
      </group>
    </group>
  );
}
