"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CatmullRomCurve3, type Group, TubeGeometry, Vector3 } from "three";
import { ball, onBody, outlineMaterial, Part, plain, toon } from "../kit";
import type { ModelProps } from "../types";

/*
 * Rattata in GO's pose, from the art, HOME and GO's model (notes/research/species-1.md).
 * Height 1 is the tail's curled tip: the crouched body is only the bottom
 * half, the thin tail stands straight up and curls at the top. Big round
 * ears with cream insides, a long snout with two white buck teeth always
 * showing, fierce red eyes under a heavy lid, long cream whiskers.
 */

const PURPLE = "#a878c0";
const CREAM = "#efdcb4";
const EAR = "#dcb898";
const DARK = "#1c1620";

const HEAD = [0, 0.3, 0.17] as const;
const HEAD_R = [0.15, 0.13, 0.14] as const;

/** The tail from its base on the rump: straight up, then the curl at the top. */
const BASE = new Vector3(0, 0.25, -0.32);
const tailCurve = new CatmullRomCurve3(
  [
    [0, 0.25, -0.32],
    [0, 0.42, -0.37],
    [0, 0.62, -0.36],
    [0, 0.8, -0.32],
    [0, 0.93, -0.27],
    [0, 0.975, -0.21],
    [0, 0.94, -0.165],
    [0, 0.895, -0.195],
  ].map(([x, y, z]) => new Vector3(x, y, z).sub(BASE)),
);
const tail = new TubeGeometry(tailCurve, 64, 0.02, 8);
const tailHull = new TubeGeometry(tailCurve, 64, 0.026, 8);

/** A fierce eye: white, a red iris toward the nose, a black pupil, a heavy lid slanting down to the snout. */
function FierceEye({ s }: { s: -1 | 1 }) {
  const { at, turn } = onBody(HEAD, HEAD_R, s * 0.78, 0.17, 0.003);
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
      <mesh geometry={ball} material={plain("#ffffff")} scale={[0.032, 0.022, 0.01]} />
      <mesh geometry={ball} material={plain("#d0203a")} position={[-s * 0.01, -0.002, 0.005]} scale={[0.016, 0.018, 0.008]} />
      <mesh geometry={ball} material={plain(DARK)} position={[-s * 0.011, -0.002, 0.009]} scale={[0.008, 0.011, 0.006]} />
      <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.016, 0.007, 0.012]} scale={0.004} />
      <mesh geometry={ball} material={plain(DARK)} position={[0, 0.018, 0.006]} rotation={[0, 0, s * 0.38]} scale={[0.038, 0.008, 0.012]} />
    </group>
  );
}

export function Rattata({ seed = 0 }: ModelProps) {
  const tailRef = useRef<Group>(null);
  const snout = useRef<Group>(null);
  const ears = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // the tail sways from its base; the snout sniffs in bursts; an ear flicks now and then
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(t * 2 * Math.PI * 0.9) * 0.12;
    if (snout.current) snout.current.position.y = t % 3 < 1 ? Math.sin(t * 25) * 0.006 : 0;
    const flick = t % 4.3 < 0.25 ? Math.sin((t % 4.3) * Math.PI * 4) * 0.4 : 0;
    if (ears.current?.children[0]) ears.current.children[0].rotation.x = flick;
  });
  return (
    <group>
      {/* the low, long body with its cream belly */}
      <Part geometry={ball} color={PURPLE} at={[0, 0.2, -0.08]} scale={[0.15, 0.13, 0.25]} turn={[0.1, 0, 0]} outline={0.01} />
      <Part geometry={ball} color={CREAM} at={[0, 0.15, -0.04]} scale={[0.12, 0.08, 0.2]} outline={0} />
      {/* thin front legs under the head, round haunches behind, cream paws */}
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part geometry={ball} color={PURPLE} at={[s * 0.09, 0.08, 0.14]} scale={[0.035, 0.08, 0.04]} outline={0.006} />
          <Part geometry={ball} color={PURPLE} at={[s * 0.12, 0.1, -0.22]} scale={[0.06, 0.09, 0.09]} outline={0.008} />
          <Part geometry={ball} color={CREAM} at={[s * 0.09, 0.015, 0.16]} scale={[0.035, 0.018, 0.05]} outline={0.005} />
          <Part geometry={ball} color={CREAM} at={[s * 0.12, 0.015, -0.18]} scale={[0.04, 0.018, 0.05]} outline={0.005} />
        </group>
      ))}
      {/* the tail, standing straight up with its curl */}
      <group ref={tailRef} position={BASE.toArray()}>
        <mesh geometry={tail} material={toon(PURPLE)} castShadow />
        <mesh geometry={tailHull} material={outlineMaterial} />
      </group>
      {/* head, cream cheeks, big round ears */}
      <Part geometry={ball} color={PURPLE} at={HEAD} scale={HEAD_R} outline={0.01} />
      <Part geometry={ball} color={CREAM} at={[0, 0.25, 0.25]} scale={[0.13, 0.07, 0.11]} outline={0} />
      <group ref={ears}>
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * 0.13, 0.43, 0.1]} rotation={[0, s * 0.5, -s * 0.3]}>
            <Part geometry={ball} color={PURPLE} scale={[0.065, 0.07, 0.02]} outline={0.008} />
            <Part geometry={ball} color={EAR} at={[0, 0, 0.012]} scale={[0.048, 0.053, 0.01]} outline={0} />
          </group>
        ))}
      </group>
      {([-1, 1] as const).map((s) => (
        <FierceEye key={s} s={s} />
      ))}
      {/* the snout: nose, buck teeth, whiskers */}
      <group ref={snout}>
        <Part geometry={ball} color={PURPLE} at={[0, 0.29, 0.3]} scale={[0.075, 0.06, 0.1]} turn={[0.2, 0, 0]} outline={0.008} />
        <Part geometry={ball} color="#b058b8" at={[0, 0.3, 0.395]} scale={[0.025, 0.02, 0.02]} outline={0.004} />
        {([-1, 1] as const).map((s) => (
          <group key={s}>
            <Part geometry={ball} color="#ffffff" at={[s * 0.017, 0.215, 0.355]} scale={[0.015, 0.027, 0.007]} outline={0.004} />
            {[0, 1].map((k) => (
              <mesh
                key={k}
                geometry={ball}
                material={plain("#f6e8cc")}
                position={[s * 0.15, 0.27 - k * 0.025, 0.31 - k * 0.01]}
                rotation={[0, s * 0.3, s * (k ? -0.12 : 0.05)]}
                scale={[0.08, 0.0045, 0.0045]}
              />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
