"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { CylinderGeometry, type Group, SphereGeometry } from "three";
import { ball, cone, cutout, onBody, Part, plain, toon } from "../kit";
import type { ModelProps } from "../types";

/*
 * Zubat in GO's flying pose, from the art, HOME and GO's model (notes/research/species-1.md).
 * Height 1 is the wing tops to the leg tips. No eyes: the face is one huge
 * grin with four white fangs. Big pointed ears, bat wings spread wide (blue
 * bones, purple membrane, scalloped back edges), and two thin legs trailing
 * behind. It flaps fast and darts about in little jerks.
 */

const BLUE = "#3f8fc0";
const MEMBRANE = "#9a6aa8";
const EAR = "#8a5a96";
const DARK = "#1c1620";

const BODY = [0, 0.58, 0] as const;
const BODY_R = [0.14, 0.16, 0.14] as const;

/** The left wing in its own plane: shoulder at the origin, +x outward, scalloped trailing edge. GO spreads it to about 5 body widths across. */
const WING: [number, number][] = [
  [0, 0],
  [0.04, 0.2],
  [0.13, 0.35],
  [0.26, 0.33],
  [0.42, 0.24],
  [0.6, 0.09],
  [0.51, 0.07],
  [0.42, 0.04],
  [0.35, -0.02],
  [0.26, 0.0],
  [0.15, -0.02],
  [0.05, -0.06],
];
/** The bones: the arm up to the wrist and out to the tip, and a finger down to the middle scallop. */
const BONES: [[number, number], [number, number], number][] = [
  [[0, 0], [0.13, 0.35], 0.018],
  [[0.13, 0.35], [0.6, 0.09], 0.014],
  [[0.13, 0.35], [0.35, -0.02], 0.012],
];
const wings = {
  1: cutout(WING, 0.008),
  [-1]: cutout(WING.map(([x, y]) => [-x, y] as [number, number]).reverse(), 0.008),
} as const;
const rod = new CylinderGeometry(1, 1, 1, 8);

/** The grin: a dark patch of the body's own surface, wide across the lower front. */
const grin = new SphereGeometry(1, 20, 6, Math.PI / 2 - 0.66, 1.32, Math.PI / 2 + 0.25 - 0.15, 0.3);

/** A dart offset for each beat of its jittery flight, the same every time for a given seed. */
const dart = (k: number) => [Math.sin(k * 12.9898) * 0.12, Math.sin(k * 78.233) * 0.05, Math.sin(k * 37.719) * 0.08] as const;

export function Zubat({ seed = 0 }: ModelProps) {
  const root = useRef<Group>(null);
  const flaps = useRef<Group>(null);
  const legs = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed;
    // fast flaps, a quick downstroke and a slower upstroke
    const beat = Math.sin(t * Math.PI * 2 * 4);
    const flap = (beat > 0 ? beat : beat * 0.7) * 0.45;
    flaps.current?.children.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * flap));
    if (legs.current) legs.current.rotation.x = Math.sin(t * Math.PI * 2 * 4 - 1.2) * 0.12;
    // the body bobs against the flaps, and darts to a new spot every second and a half
    const [x, y, z] = dart(Math.floor(t / 1.5) + seed * 7);
    const g = root.current;
    if (g) {
      const k = Math.min(1, dt * 12);
      g.position.x += (x - g.position.x) * k;
      g.position.z += (z - g.position.z) * k;
      g.position.y = y - flap * 0.06;
    }
  });
  return (
    <group ref={root}>
      {/* body and the big ears */}
      <Part geometry={ball} color={BLUE} at={BODY} scale={BODY_R} outline={0.01} />
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.09, 0.75, 0]} rotation={[0, 0, -s * 0.5]}>
          <Part geometry={cone} color={BLUE} scale={[0.065, 0.15, 0.03]} outline={0.008} />
          <Part geometry={cone} color={EAR} at={[0, -0.01, 0.018]} scale={[0.045, 0.11, 0.015]} outline={0} />
        </group>
      ))}
      {/* the grin and its four fangs */}
      <mesh geometry={grin} material={plain(DARK)} position={[...BODY]} scale={[BODY_R[0] * 1.012, BODY_R[1] * 1.012, BODY_R[2] * 1.012]} />
      {([-1, 1] as const).map((s) => {
        const top = onBody(BODY, BODY_R, s * 0.3, -0.12, 0.006);
        const bottom = onBody(BODY, BODY_R, s * 0.2, -0.37, 0.006);
        return (
          <group key={s}>
            <mesh geometry={cone} material={plain("#ffffff")} position={[top.at[0], top.at[1] - 0.015, top.at[2]]} rotation={[Math.PI, 0, 0]} scale={[0.014, 0.03, 0.01]} />
            <mesh geometry={cone} material={plain("#ffffff")} position={[bottom.at[0], bottom.at[1] + 0.012, bottom.at[2]]} scale={[0.011, 0.024, 0.008]} />
          </group>
        );
      })}
      {/* the wings, spread wide, tilted up a little so they show from above */}
      <group ref={flaps}>
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * 0.12, 0.62, -0.02]} rotation={[-0.25, s * 0.15, 0]}>
            <mesh geometry={wings[s]} material={toon(MEMBRANE)} castShadow />
            {BONES.map(([[ax, ay], [bx, by], r], i) => {
              const len = Math.hypot(bx - ax, by - ay);
              return (
                <group key={i}>
                  <Part
                    geometry={rod}
                    color={BLUE}
                    at={[(s * (ax + bx)) / 2, (ay + by) / 2, 0]}
                    scale={[r, len, r]}
                    turn={[0, 0, Math.atan2(by - ay, s * (bx - ax)) - Math.PI / 2]}
                    outline={0.004}
                  />
                  <Part geometry={ball} color={BLUE} at={[s * bx, by, 0]} scale={[r, r, r]} outline={0.004} />
                </group>
              );
            })}
          </group>
        ))}
      </group>
      {/* two thin legs trailing down and back */}
      <group ref={legs} position={[0, 0.44, -0.02]}>
        {([-1, 1] as const).map((s) => (
          <Part key={s} geometry={cone} color={BLUE} at={[s * 0.05, -0.18, -0.13]} scale={[0.02, 0.44, 0.02]} turn={[-(Math.PI - 0.6), 0, 0]} outline={0.004} />
        ))}
      </group>
    </group>
  );
}
