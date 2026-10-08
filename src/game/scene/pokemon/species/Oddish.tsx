"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, LatheGeometry, TorusGeometry, Vector2 } from "three";
import { ball, onBody, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Oddish, from the art, HOME and GO's model (notes/research/species-1.md).
 * Height 1 is the tip of the tallest leaf. A blue ball a little wider than
 * tall, two stubby feet, tiny red eyes far apart, a small smile, and a fan
 * of five big pointed leaves out of the top (light at the tips, a dark
 * midrib), tipped back so they show from above. No arms.
 */

const BLUE = "#5f9fc8";
const FEET = "#4f86ad";
const LEAF = "#4fb33c";
const TIP = "#a8e878";
const RIB = "#2f7a2a";

const BODY = [0, 0.37, 0] as const;
const BODY_R = [0.23, 0.2, 0.22] as const;

/** A leaf's half-width along its length (0 at the base, 1 at the tip): widest at 40%, pointed at the tip. */
const width = (y: number) => 0.9 * Math.pow(Math.sin(Math.PI * Math.pow(y, 0.75)), 0.9);
const leafFrom = (from: number) =>
  new LatheGeometry(
    Array.from({ length: 25 }, (_, i) => {
      const y = from + ((1 - from) * i) / 24;
      return new Vector2(Math.max(0.0005, i === 0 && from > 0 ? 0.0005 : width(y)), y);
    }),
    16,
  );
const leaf = leafFrom(0);
/** The lighter outer third, the same shape, a hair thicker so it sits on top. */
const leafTip = leafFrom(0.66);
const smile = new TorusGeometry(0.025, 0.005, 4, 12, Math.PI);

/** The fan, as [tilt out from straight up, length]: center, the two at 28 degrees, the two at 62. */
const LEAVES: [number, number][] = [
  [0, 0.52],
  [-0.49, 0.5],
  [0.49, 0.5],
  [-1.08, 0.46],
  [1.08, 0.46],
];

export function Oddish({ seed = 0 }: ModelProps) {
  const body = useRef<Group>(null);
  const leaves = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a gentle bounce, and the leaves swaying, each a little behind the last
    if (body.current) body.current.scale.y = 1 + Math.sin(t * Math.PI * 2 * 1.5) * 0.03;
    leaves.current?.children.forEach((g, i) => (g.rotation.z = -LEAVES[i][0] + Math.sin(t * Math.PI * 2 * 1.2 - i * 0.7) * 0.08));
  });
  return (
    <group>
      {([-1, 1] as const).map((s) => (
        <Part key={s} geometry={ball} color={FEET} at={[s * 0.08, 0.085, 0.07]} scale={[0.07, 0.085, 0.095]} outline={0.008} />
      ))}
      <group ref={body}>
        <Part geometry={ball} color={BLUE} at={BODY} scale={BODY_R} outline={0.012} />
        <Part geometry={ball} color={BLUE} at={[0, 0.52, -0.01]} scale={[0.14, 0.08, 0.13]} outline={0} />
        {/* tiny red eyes with a dark rim and a glint, and a small smile */}
        {([-1, 1] as const).map((s) => {
          const { at, turn } = onBody(BODY, BODY_R, s * 0.48, 0.64, 0.002);
          return (
            <group key={s} position={at as [number, number, number]} rotation={turn as [number, number, number]}>
              <mesh geometry={ball} material={plain("#1c1620")} scale={[0.02, 0.023, 0.006]} />
              <mesh geometry={ball} material={plain("#f06a78")} position={[0, -0.002, 0.003]} scale={[0.015, 0.018, 0.006]} />
              <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.005, 0.007, 0.007]} scale={0.0055} />
            </group>
          );
        })}
        {(() => {
          const { at, turn } = onBody(BODY, BODY_R, 0, 0.28, 0.002);
          return (
            <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
              <mesh geometry={smile} material={plain("#1c1620")} rotation={[0, 0, Math.PI]} />
            </group>
          );
        })()}
        {/* the fan of five leaves, tipped back */}
        <group position={[0, 0.52, -0.02]} rotation={[-0.35, 0, 0]}>
          <group ref={leaves}>
            {LEAVES.map(([tilt, len], i) => (
              <group key={i} rotation={[0, -tilt * 0.35, -tilt]}>
                <Part geometry={leaf} color={LEAF} scale={[0.085, len, 0.022]} outline={0.008} />
                <Part geometry={leafTip} color={TIP} scale={[0.0855, len, 0.026]} outline={0} />
                <mesh geometry={ball} material={plain(RIB)} position={[0, len * 0.42, 0]} scale={[0.006, len * 0.38, 0.026]} />
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
