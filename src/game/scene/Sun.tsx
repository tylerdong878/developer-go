"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AddEquation,
  Color,
  CustomBlending,
  type DirectionalLight,
  DstColorFactor,
  type Group,
  type Material,
  Matrix4,
  Object3D,
  OneMinusSrcAlphaFactor,
  type ShadowMaterial,
  Vector3,
} from "three";
import { game } from "../state";

/** Which way the sun shines from: high, off to the south-east. */
const DIR = new Vector3(30, 60, 20).normalize();
/** The shadow camera's own axes, so its center can snap to whole shadow texels. */
const BASIS = new Matrix4().lookAt(DIR, new Vector3(), new Vector3(0, 1, 0));
const INVERSE = BASIS.clone().invert();
const HALF = 45;
/** Where the shadow box sits: a little ahead of the trainer, where the camera looks. */
const center = new Vector3();
const ahead = new Vector3();
const want = new Color();
/** The catcher's material, eased toward the time of day like the light. */
const catcher = { color: new Color(), opacity: 0, first: true };

/**
 * The sun, casting real shadows. Its shadow box follows what the camera sees,
 * snapped to whole texels in the light's own space, so edges stay still as
 * he walks.
 */
export function Sun({ color, intensity, shadow, mapSize }: { color: string; intensity: number; shadow: { color: string; opacity: number }; mapSize: number }) {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  useFrame(({ camera }, dt) => {
    const l = light.current;
    if (!l) return;
    // ease toward the time of day, so day and night glide
    const k = catcher.first ? 1 : 1 - Math.exp(-2.4 * dt);
    catcher.first = false;
    l.color.lerp(want.set(color), k);
    l.intensity += (intensity - l.intensity) * k;
    catcher.color.lerp(want.set(shadow.color), k);
    catcher.opacity += (shadow.opacity - catcher.opacity) * k;
    const { x, z } = game.player.trainer.position;
    camera.getWorldDirection(ahead);
    ahead.y = 0;
    ahead.normalize();
    center.set(x, 0, z).addScaledVector(ahead, 14).applyMatrix4(INVERSE);
    const texel = (2 * HALF) / mapSize;
    center.x = Math.round(center.x / texel) * texel;
    center.y = Math.round(center.y / texel) * texel;
    center.applyMatrix4(BASIS);
    l.position.copy(center).addScaledVector(DIR, 80);
    target.position.copy(center);
    target.updateMatrixWorld();
  });
  return (
    <>
      <directionalLight
        ref={light}
        target={target}
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-HALF}
        shadow-camera-right={HALF}
        shadow-camera-top={HALF}
        shadow-camera-bottom={-HALF}
        shadow-camera-near={10}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={4}
      />
      <ShadowCatcher />
    </>
  );
}

/**
 * The ground is flat-colored and unlit, so shadows land on a clear layer
 * just above it that only draws the shadows. It multiplies, so shadow on
 * grass is a deeper blue-green and shadow on a road is pale blue, not gray.
 */
function ShadowCatcher() {
  const plane = useRef<Group>(null);
  const material = useRef<ShadowMaterial>(null);
  useFrame(() => {
    plane.current?.position.set(center.x, 0.015, center.z);
    material.current?.color.copy(catcher.color);
    if (material.current) material.current.opacity = catcher.opacity;
  });
  return (
    <group ref={plane}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow renderOrder={-25}>
        <planeGeometry args={[HALF * 2.4, HALF * 2.4]} />
        <shadowMaterial
          ref={material}
          transparent
          premultipliedAlpha
          depthWrite={false}
          blending={CustomBlending}
          blendEquation={AddEquation}
          blendSrc={DstColorFactor}
          blendDst={OneMinusSrcAlphaFactor}
        />
      </mesh>
    </group>
  );
}

/**
 * Makes every solid mesh inside cast a shadow (not the see-through blob
 * shadows and glows, and not anything under a group marked `noShadow`, like
 * Pokémon, which GO grounds with a soft blob instead).
 */
export function CastShadows({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    const mark = (o: Object3D) => {
      if (o.userData.noShadow) return;
      if ("isMesh" in o && o.isMesh && !((o as unknown as { material: Material }).material.transparent)) o.castShadow = true;
      o.children.forEach(mark);
    };
    if (group.current) mark(group.current);
  });
  return <group ref={group}>{children}</group>;
}
