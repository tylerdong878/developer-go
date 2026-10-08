"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, Object3D, Quaternion, Vector3 } from "three";
import { ball, cutout, half, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Voltorb, from HOME and GO (notes/research/species-3.md): a sphere split at
 * the equator, cool crimson over cool gray, joined by a hairline seam (no
 * band, no button: it isn't a Poké Ball). The angry eyes are right triangles
 * set low in the red, almost on the seam, with thin vertical slit pupils, a
 * dark rim thickest along the slanted brow, and two frown creases between.
 */

const RED = "#e0284e";
const GRAY = "#e1e3ea";
const DARK = "#1c1620";
const R = 0.5;

/** The eye triangle in its own tangent plane (+x away from the face's center line, +y up). */
const EYE: [number, number][] = [
  [-0.12, -0.08],
  [0.115, -0.045],
  [0.1, 0.11],
];
const rimOf = (pts: [number, number][]) => {
  const cx = pts.reduce((a, [x]) => a + x, 0) / 3;
  const cy = pts.reduce((a, [, y]) => a + y, 0) / 3;
  return pts.map(([x, y]) => [cx + (x - cx) * 1.14, cy + (y - cy) * 1.14 + 0.006] as [number, number]);
};
const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [-x, y] as [number, number]).reverse();
const eyeWhite = { 1: cutout(EYE, 0.03), [-1]: cutout(mirror(EYE), 0.03) } as const;
const eyeRim = { 1: cutout(rimOf(EYE), 0.026), [-1]: cutout(mirror(rimOf(EYE)), 0.026) } as const;

/** Where each eye sits on the ball (lon 25°, lat 15°), turned to face out along the ball's normal. */
function eyeFrame(s: -1 | 1) {
  const lon = (s * 25 * Math.PI) / 180;
  const lat = (15 * Math.PI) / 180;
  const n = new Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  const o = new Object3D();
  o.position.copy(n).multiplyScalar(R - 0.003);
  o.lookAt(o.position.clone().add(n));
  return { at: o.position.toArray() as [number, number, number], q: o.quaternion.clone() as Quaternion };
}
const FRAMES = { 1: eyeFrame(1), [-1]: eyeFrame(-1) } as const;

export function Voltorb({ seed = 0 }: ModelProps) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    // a restless jitter, like it might go off
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 7 + seed) * 0.04;
  });
  return (
    <group ref={g} position={[0, R, 0]} rotation={[-0.15, 0, 0]}>
      <Part geometry={half} color={RED} scale={[R, R, R]} outline={0.015} />
      <Part geometry={half} color={GRAY} scale={[R, R, R]} turn={[Math.PI, 0, 0]} outline={0.015} />
      <mesh geometry={ball} material={plain(DARK)} scale={[R + 0.003, 0.004, R + 0.003]} />
      {([-1, 1] as const).map((s) => (
        <group key={s} position={FRAMES[s].at} quaternion={FRAMES[s].q}>
          <mesh geometry={eyeRim[s]} material={plain(DARK)} position={[0, 0, -0.004]} />
          <mesh geometry={eyeWhite[s]} material={plain("#f6f6f6")} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * -0.034, -0.03, 0.017]} scale={[0.006, 0.025, 0.006]} />
        </group>
      ))}
      {/* two short frown creases between the eyes */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} geometry={ball} material={plain(DARK)} position={[s * 0.026, 0.095, 0.492]} rotation={[0, 0, s * 0.15]} scale={[0.004, 0.045, 0.004]} />
      ))}
    </group>
  );
}
