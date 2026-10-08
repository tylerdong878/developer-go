"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { ball, cone, lathe, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Bulbasaur, from the official art, HOME and GO (notes/research/species-1.md).
 * Height 1 is the bulb's tip to the soles. A squat quadruped with a broad,
 * flat-topped head, red eyes with a white crescent on the outer side under a
 * slanted black lid, darker spots (one big one on the forehead), white claws,
 * and the onion-shaped bulb with five seams and a split tip.
 */

const SKIN = "#74c8a8";
const SPOT = "#4c9b7e";
const BULB = "#5ba35a";
const DARK = "#1c1620";

/** The bulb's side profile, [radius, height]. */
const BULB_PROFILE: [number, number][] = [
  [0.18, 0.4], [0.26, 0.44], [0.31, 0.5], [0.335, 0.58], [0.33, 0.66], [0.3, 0.74], [0.25, 0.8], [0.18, 0.86], [0.1, 0.92], [0.04, 0.97], [0, 1.0],
];
const bulb = lathe(BULB_PROFILE);
/** Five seams running up the bulb, just proud of its surface. */
const seams = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  const curve = new CatmullRomCurve3(BULB_PROFILE.map(([r, y]) => new Vector3(Math.sin(a) * (r + 0.004), y, Math.cos(a) * (r + 0.004) * 0.95)));
  return new TubeGeometry(curve, 30, 0.006, 4);
});
const smile = new TorusGeometry(0.3, 0.006, 4, 24, 1.6);
const LEGS: [number, number][] = [
  [-0.24, 0.2],
  [0.24, 0.2],
  [-0.22, -0.25],
  [0.22, -0.25],
];

/** Bulbasaur's eye: white, a red iris shifted toward the nose (leaving a crescent outside), a glint. */
function BulbEye({ s }: { s: -1 | 1 }) {
  return (
    <group position={[s * 0.21, 0.52, 0.45]} rotation={[0, s * 0.65, 0]}>
      <mesh geometry={ball} material={plain("#ffffff")} scale={[0.085, 0.075, 0.03]} />
      <mesh geometry={ball} material={plain("#d23a3a")} position={[-s * 0.012, -0.004, 0.006]} scale={[0.066, 0.068, 0.03]} />
      <mesh geometry={ball} material={plain("#5a0f14")} position={[-s * 0.016, -0.006, 0.012]} scale={[0.026, 0.038, 0.026]} />
      <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.024, 0.024, 0.026]} scale={[0.01, 0.018, 0.01]} />
      {/* the slanted upper lid, dropping toward the nose */}
      <mesh geometry={ball} material={plain(DARK)} position={[0, 0.068, 0.01]} rotation={[0, 0, s * 0.25]} scale={[0.092, 0.013, 0.03]} />
    </group>
  );
}

export function Bulbasaur({ seed = 0 }: ModelProps) {
  const breathe = useRef<Group>(null);
  useFrame(({ clock }) => {
    const k = 1 + Math.sin(clock.elapsedTime * 1.6 + seed) * 0.025;
    breathe.current?.scale.set(k, k, k);
  });
  return (
    <group>
      {/* body and four legs, each with three white claws and a spot on the outside */}
      <Part geometry={ball} color={SKIN} at={[0, 0.27, -0.05]} scale={[0.3, 0.2, 0.36]} outline={0.012} />
      {LEGS.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Part geometry={ball} color={SKIN} at={[x, 0.12, z]} scale={[0.085, 0.13, 0.09]} outline={0.01} />
          <mesh geometry={ball} material={plain(SPOT)} position={[x + Math.sign(x) * 0.082, 0.15, z]} scale={[0.01, 0.045, 0.04]} />
          {[-0.035, 0, 0.035].map((dx) => (
            <mesh key={dx} geometry={cone} material={plain("#f4f4f6")} position={[x + dx, 0.02, z + 0.085]} rotation={[Math.PI / 2, 0, 0]} scale={[0.012, 0.03, 0.012]} />
          ))}
        </group>
      ))}
      {/* the bulb: onion-shaped, five seams, a split tip; it breathes slowly */}
      <group position={[0, 0, -0.08]}>
        <group ref={breathe} position={[0, 0.4, 0]}>
          <group position={[0, -0.4, 0]}>
            <Part geometry={bulb} color={BULB} scale={[1, 1, 0.95]} outline={0.012} />
            {seams.map((g, i) => (
              <mesh key={i} geometry={g} material={plain("#3a6e3c")} />
            ))}
            {[
              [0.03, 0, 0.3],
              [-0.03, 0, -0.3],
              [0, -0.03, 0],
            ].map(([x, z, tilt]) => (
              <Part key={`${x}${z}`} geometry={cone} color={BULB} at={[x, 0.98, z]} scale={[0.02, 0.06, 0.015]} turn={[z ? -0.3 : 0, 0, -tilt]} outline={0.006} />
            ))}
          </group>
        </group>
      </group>
      {/* the broad head with a flattish top, little ears, spots */}
      <Part geometry={ball} color={SKIN} at={[0, 0.54, 0.25]} scale={[0.31, 0.25, 0.26]} outline={0.012} />
      <Part geometry={ball} color={SKIN} at={[0, 0.7, 0.22]} scale={[0.27, 0.1, 0.22]} outline={0} />
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={cone} color={SKIN} at={[s * 0.25, 0.8, 0.25]} scale={[0.055, 0.1, 0.035]} turn={[0.1, 0, -s * 0.45]} outline={0.008} />
          <BulbEye s={s} />
          <mesh geometry={ball} material={plain(DARK)} position={[s * 0.04, 0.42, 0.49]} scale={[0.008, 0.006, 0.005]} />
        </group>
      ))}
      <mesh geometry={ball} material={plain(SPOT)} position={[-0.04, 0.71, 0.36]} rotation={[-0.6, 0, 0.35]} scale={[0.09, 0.025, 0.05]} />
      <mesh geometry={ball} material={plain(SPOT)} position={[0, 0.63, 0.47]} scale={[0.02, 0.02, 0.008]} />
      <mesh geometry={ball} material={plain(SPOT)} position={[0.01, 0.57, 0.49]} scale={[0.028, 0.028, 0.008]} />
      <mesh geometry={smile} material={plain(DARK)} position={[0, 0.63, 0.42]} rotation={[0, 0, -Math.PI / 2 - 0.8]} />
    </group>
  );
}
