"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { ball, cone, onBody, Part, plain } from "../kit";
import type { ModelProps } from "../types";

/*
 * Pidgey, from the official art, HOME and GO's own model (notes/research/species-1.md).
 * Height 1 is the crest tip to the soles. A plump brown egg with a cream
 * face and breast, folded darker wings with a cream fringe, narrow fierce
 * eyes inside a black mask, a short pink beak, the cream brow band sweeping
 * back into spikes, a spiky crest, and a fan of tail feathers. From above,
 * the crest and the brow band are what read.
 */

const BROWN = "#b07a3c";
const CREAM = "#f3e6a8";
const WING = "#9a6232";
const BROW = "#f4ecb4";
const MASK = "#2a2228";
const PINK = "#d8a8b6";
const FEET = "#c98f9e";
const DARK = "#1c1620";

/** The head, relative to the neck pivot it turns on. */
const NECK: [number, number, number] = [0, 0.62, 0.02];
const HEAD = [0, 0.74 - NECK[1], 0.04 - NECK[2]] as const;
const HEAD_R = [0.17, 0.16, 0.17] as const;

/** A narrow almond eye: white, a black pupil toward the beak, a heavy lid slanting down to it. */
function Almond({ s }: { s: -1 | 1 }) {
  const { at, turn } = onBody(HEAD, HEAD_R, s * 0.62, 0.42, 0.004);
  return (
    <group position={at as [number, number, number]} rotation={turn as [number, number, number]}>
      <mesh geometry={ball} material={plain("#ffffff")} scale={[0.045, 0.026, 0.012]} />
      <mesh geometry={ball} material={plain(DARK)} position={[-s * 0.016, -0.002, 0.006]} scale={[0.017, 0.02, 0.01]} />
      <mesh geometry={ball} material={plain("#ffffff")} position={[-s * 0.02, 0.008, 0.012]} scale={0.005} />
      <mesh geometry={ball} material={plain(DARK)} position={[0, 0.022, 0.006]} rotation={[0, 0, s * 0.32]} scale={[0.052, 0.009, 0.014]} />
    </group>
  );
}

export function Pidgey({ seed = 0 }: ModelProps) {
  const head = useRef<Group>(null);
  const wings = useRef<Group>(null);
  const body = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed;
    // quick head snaps to look around, every second and a half
    const look = [0, 0.4, 0, -0.35, 0.15][Math.floor(t / 1.5) % 5];
    if (head.current) head.current.rotation.y += (look - head.current.rotation.y) * Math.min(1, dt * 14);
    // breathing, and now and then three quick flaps
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 2.4) * 0.015;
    const flap = t % 6.5 < 0.5 ? Math.abs(Math.sin((t % 6.5) * Math.PI * 6)) * 0.55 : 0;
    wings.current?.children.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * flap));
  });
  return (
    <group>
      <group ref={body}>
        {/* the egg body, breast pushing forward, cream down the front */}
        <Part geometry={ball} color={BROWN} at={[0, 0.4, -0.02]} scale={[0.27, 0.23, 0.28]} turn={[0.15, 0, 0]} outline={0.012} />
        <Part geometry={ball} color={CREAM} at={[0, 0.39, 0.07]} scale={[0.23, 0.22, 0.2]} outline={0} />
        {/* the fan of tail feathers */}
        {[-0.15, 0, 0.15].map((r, i) => (
          <Part key={r} geometry={ball} color={BROWN} at={[r * 0.15, 0.31 + i * 0.02, -0.38]} scale={[0.055, 0.02, 0.15]} turn={[-0.25, 0, r]} outline={0.006} />
        ))}
      </group>
      {/* folded wings, darker, with the cream fringe underneath */}
      <group ref={wings}>
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * 0.2, 0.58, -0.04]}>
            <Part geometry={ball} color={WING} at={[s * 0.05, -0.18, -0.02]} scale={[0.06, 0.21, 0.22]} turn={[0.25, s * 0.1, 0]} outline={0.01} />
            <Part geometry={ball} color={CREAM} at={[s * 0.05, -0.36, -0.06]} scale={[0.05, 0.045, 0.17]} outline={0} />
          </group>
        ))}
      </group>
      {/* thin pink legs, three toes forward and one back */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.08, 0, 0.02]}>
          <Part geometry={ball} color={FEET} at={[0, 0.1, 0]} scale={[0.025, 0.08, 0.025]} outline={0.005} />
          {[-0.5, 0, 0.5, Math.PI].map((a) => (
            <mesh key={a} geometry={ball} material={plain(FEET)} position={[Math.sin(a) * 0.04, 0.015, Math.cos(a) * 0.04]} rotation={[0, a, 0]} scale={[0.014, 0.012, 0.045]} />
          ))}
        </group>
      ))}
      {/* the head turns on its neck */}
      <group ref={head} position={NECK}>
        <Part geometry={ball} color={BROWN} at={HEAD} scale={HEAD_R} outline={0.012} />
        <Part geometry={ball} color={CREAM} at={[0, 0.72 - NECK[1], 0.09 - NECK[2]]} scale={[0.15, 0.13, 0.13]} outline={0} />
        {/* the cream brow band across the forehead, sweeping back into spikes */}
        <Part geometry={ball} color={BROW} at={[0, 0.845 - NECK[1], 0.05 - NECK[2]]} scale={[0.175, 0.028, 0.155]} turn={[0.15, 0, 0]} outline={0.006} />
        {([-1, 1] as const).flatMap((s) =>
          [
            [0.15, 0.835, -0.07, 0.52],
            [0.11, 0.855, -0.12, 0.3],
          ].map(([x, y, z, out]) => (
            <Part key={`${s}${x}`} geometry={cone} color={BROW} at={[s * x, y - NECK[1], z - NECK[2]]} scale={[0.03, 0.1, 0.018]} turn={[-1.2, 0, -s * out]} outline={0.005} />
          )),
        )}
        {/* the spiky crest, leaning back */}
        <Part geometry={cone} color={BROWN} at={[0, 0.92 - NECK[1], -0.02 - NECK[2]]} scale={[0.04, 0.17, 0.028]} turn={[-0.35, 0, 0]} outline={0.006} />
        {([-1, 1] as const).map((s) => (
          <Part key={s} geometry={cone} color={BROWN} at={[s * 0.04, 0.9 - NECK[1], -0.05 - NECK[2]]} scale={[0.032, 0.14, 0.024]} turn={[-0.65, 0, -s * 0.35]} outline={0.006} />
        ))}
        {/* the black mask running back from each eye, the eyes, and the short pink beak */}
        {([-1, 1] as const).map((s) => {
          const mask = onBody(HEAD, HEAD_R, s * 1.15, 0.2, 0.002, -s * 0.5);
          return (
            <group key={s}>
              <mesh geometry={ball} material={plain(MASK)} position={mask.at as [number, number, number]} rotation={mask.turn as [number, number, number]} scale={[0.075, 0.04, 0.012]} />
              <Almond s={s} />
            </group>
          );
        })}
        <Part geometry={ball} color={PINK} at={[0, 0.755 - NECK[1], 0.205 - NECK[2]]} scale={[0.05, 0.045, 0.06]} outline={0.008} />
        <Part geometry={cone} color={PINK} at={[0, 0.74 - NECK[1], 0.255 - NECK[2]]} scale={[0.035, 0.06, 0.035]} turn={[Math.PI / 2 + 0.45, 0, 0]} outline={0.006} />
      </group>
    </group>
  );
}
