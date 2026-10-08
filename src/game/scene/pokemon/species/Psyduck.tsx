"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CapsuleGeometry, type Group } from "three";
import { ball, cone, onBody, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Psyduck in GO's standing pose, from the art, HOME and GO's model
 * (notes/research/species-2.md). Height 1 is the top of the head. A round
 * yellow head on a pear body, three black hairs fanned on top, a huge flat
 * cream bill, a blank stare (white ovals, pinprick pupils, no glint),
 * flipper arms hanging out to the sides, flat webbed feet, a little tail.
 * Every ten seconds or so it gets its headache: both hands to its head.
 */

const YELLOW = "#f7cd4c";
const BILL = "#fbf3d9";
const FEET = "#efe5bf";
const HAIR = "#26222a";
const DARK = "#1c1620";

/** The head, relative to the neck it tilts on. */
const NECK = 0.5;
const HEAD = [0, 0.635 - NECK, 0] as const;
const HEAD_R = [0.245, 0.23, 0.23] as const;

/** The three hairs: tilt from straight up (+ to our left) and length. */
const HAIRS = ([
  [0.32, 0.085],
  [-0.08, 0.105],
  [-1.0, 0.085],
] as const).map(([tilt, len]) => ({ tilt, len, geometry: new CapsuleGeometry(0.0125, len, 4, 8) }));

/** How far the arms are raised into the headache pose right now (0 to 1), on a ten-second loop. */
function headache(t: number) {
  const p = t % 10.5;
  if (p > 2.6) return 0;
  const up = Math.min(1, p / 0.35);
  const down = Math.min(1, (2.6 - p) / 0.35);
  const k = Math.min(up, down);
  return k * k * (3 - 2 * k);
}

export function Psyduck({ seed = 0 }: ModelProps) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const arms = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 3.1;
    const ache = headache(t);
    // a slow waddle, flippers flapping a little, and the headache now and then
    if (root.current) root.current.rotation.z = Math.sin(t * 2) * 0.05 * (1 - ache);
    if (head.current) head.current.rotation.z = ache * 0.12;
    arms.current?.children.forEach((g, i) => {
      const s = i ? -1 : 1;
      g.rotation.z = s * (Math.sin(t * 4) * 0.08 * (1 - ache) + ache * 2.25);
      g.rotation.y = -s * ache * 0.35;
    });
  });
  return (
    <group ref={root}>
      {/* a pear body, a little tail behind */}
      <Part geometry={ball} color={YELLOW} at={[0, 0.23, 0]} scale={[0.29, 0.21, 0.26]} outline={0.012} />
      <Part geometry={ball} color={YELLOW} at={[0, 0.4, 0]} scale={[0.24, 0.15, 0.21]} outline={0.012} />
      <Part geometry={cone} color={YELLOW} at={[0, 0.17, -0.26]} scale={[0.055, 0.15, 0.03]} turn={[-1.1, 0, 0]} outline={0.006} />
      {/* flat webbed feet with three toes */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.14, 0.03, 0.1]} rotation={[0, s * 0.2, 0]}>
          <Part geometry={ball} color={FEET} scale={[0.11, 0.032, 0.13]} outline={0.008} />
          {[-0.06, 0, 0.06].map((x) => (
            <mesh key={x} geometry={cone} material={plain(FEET)} position={[x, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} scale={[0.03, 0.06, 0.012]} />
          ))}
        </group>
      ))}
      {/* flipper arms from the shoulders, sloping down and out */}
      <group ref={arms}>
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * 0.24, 0.43, 0]}>
            <Part geometry={ball} color={YELLOW} at={[s * 0.115, -0.09, 0.02]} scale={[0.145, 0.045, 0.06]} turn={[0, 0, -s * 0.67]} outline={0.008} />
          </group>
        ))}
      </group>
      {/* the head tilts on its neck when it aches */}
      <group ref={head} position={[0, NECK, 0]}>
        <Part geometry={ball} color={YELLOW} at={HEAD} scale={HEAD_R} outline={0.012} />
        {HAIRS.map(({ tilt, len, geometry }) => (
          <group key={tilt} position={[0, 0.855 - NECK, -0.03]} rotation={[0, 0, tilt]}>
            <mesh geometry={geometry} material={plain(HAIR)} position={[0, len / 2 + 0.0125, 0]} />
          </group>
        ))}
        {/* the blank stare: dark rims, white ovals, pinprick pupils looking a little inward */}
        {([-1, 1] as const).map((s) => {
          const { at, turn } = onBody(HEAD, HEAD_R, s * 0.53, 0.13, 0.006);
          return (
            <group key={s} position={at as [number, number, number]} rotation={turn as [number, number, number]}>
              <mesh geometry={ball} material={plain("#3a3428")} scale={[0.075, 0.051, 0.03]} />
              <mesh geometry={ball} material={plain("#fbfbf8")} position={[0, 0, 0.006]} scale={[0.068, 0.045, 0.03]} />
              <mesh geometry={ball} material={plain(DARK)} position={[-s * 0.006, 0, 0.034]} scale={[0.008, 0.008, 0.004]} />
            </group>
          );
        })}
        {/* the huge flat bill, tipping down, with two nostril dashes */}
        <Part geometry={ball} color={BILL} at={[0, 0.58 - NECK, 0.19]} scale={[0.1, 0.06, 0.1]} turn={[0.6, 0, 0]} outline={0.008} />
        <Part geometry={ball} color={BILL} at={[0, 0.47 - NECK, 0.3]} scale={[0.185, 0.07, 0.16]} turn={[0.45, 0, 0]} outline={0.01} />
        {([-1, 1] as const).map((s) => (
          <mesh key={s} geometry={ball} material={plain(DARK)} position={[s * 0.028, 0.6 - NECK, 0.265]} rotation={[0.6, 0, s * 0.4]} scale={[0.006, 0.012, 0.004]} />
        ))}
      </group>
    </group>
  );
}
