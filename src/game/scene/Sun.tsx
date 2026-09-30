"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { type DirectionalLight, type Group, type Material, Object3D } from "three";
import { game } from "../state";

/** Where the sun sits relative to the trainer: high, off to the south-east. */
const OFFSET = { x: 30, y: 60, z: 20 };

/**
 * The sun, casting real soft shadows. Its shadow box follows the trainer,
 * so shadows stay crisp wherever he walks instead of covering the whole base
 * at low resolution.
 */
export function Sun({ color, intensity, night, mapSize }: { color: string; intensity: number; night: boolean; mapSize: number }) {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const { x, z } = game.player.trainer.position;
    // Snap to a grid so shadow edges don't shimmer as he walks.
    const sx = Math.round(x);
    const sz = Math.round(z);
    l.position.set(sx + OFFSET.x, OFFSET.y, sz + OFFSET.z);
    target.position.set(sx, 0, sz);
    target.updateMatrixWorld();
  });
  return (
    <>
      <directionalLight
        ref={light}
        color={color}
        intensity={intensity}
        target={target}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={10}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={4}
      />
      <ShadowCatcher opacity={night ? 0.22 : 0.32} />
    </>
  );
}

/**
 * The ground is flat-colored and unlit, so shadows land on a clear layer
 * just above it that only draws the shadows.
 */
function ShadowCatcher({ opacity }: { opacity: number }) {
  const plane = useRef<Group>(null);
  useFrame(() => {
    const { x, z } = game.player.trainer.position;
    plane.current?.position.set(x, 0.015, z);
  });
  return (
    <group ref={plane}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow renderOrder={-25}>
        <planeGeometry args={[110, 110]} />
        <shadowMaterial transparent opacity={opacity} depthWrite={false} color="#0a2a4a" />
      </mesh>
    </group>
  );
}

/** Makes every solid mesh inside cast a shadow (not the see-through blob shadows and glows). */
export function CastShadows({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    group.current?.traverse((o) => {
      if ("isMesh" in o && o.isMesh && !((o as unknown as { material: Material }).material.transparent)) o.castShadow = true;
    });
  });
  return <group ref={group}>{children}</group>;
}
