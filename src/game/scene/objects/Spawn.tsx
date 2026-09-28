"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, ConeGeometry, type Group, type Sprite, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Spawn as SpawnContent } from "@/content";
import { Shadow } from "../Shadow";
import { Nameplate } from "./Nameplate";
import { hover, tapObject } from "./tap";
import { useSpriteTexture } from "./useSpriteTexture";

/** Height on the map, by dex number. Big Pokémon are big; floaters hover. */
const SIZE: Record<number, number> = { 143: 4.6, 95: 5, 106: 2.8, 865: 2.6, 56: 2, 133: 1.9, 869: 1.9, 255: 1.8 };
const HOVER: Record<number, number> = { 81: 1.1, 479: 1, 137: 0.45 };
/** How much empty space sits under each sprite's feet (measured from the images). */
const FEET: Record<number, number> = { 56: 0.152, 81: 0.234, 100: 0.012, 106: 0.066, 132: 0.074, 137: 0.004, 143: 0.102, 479: 0.016 };

/** GO's rustling grass: a few blades around a wild Pokémon's feet. */
function useTuft() {
  return useMemo(() => {
    const blades = Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const blade = new ConeGeometry(0.16, 0.85 + (i % 3) * 0.2, 4);
      blade.rotateZ(Math.cos(a) * 0.35);
      blade.rotateX(-Math.sin(a) * 0.35);
      blade.translate(Math.cos(a) * 0.62, 0.42, Math.sin(a) * 0.62);
      return blade;
    });
    return mergeGeometries(blades);
  }, []);
}

/**
 * A wild Pokémon, one per fun fact, standing in rustling grass. The sprite
 * always faces the camera and hops in place; floaters bob in the air instead.
 * Snorlax is asleep, so it gets Zzz's.
 */
export function Spawn({ spawn, x, z, grass }: { spawn: SpawnContent; x: number; z: number; grass: string }) {
  const { dex, name } = spawn.pokemon;
  const texture = useSpriteTexture(dex);
  const body = useRef<Sprite>(null);
  const tuft = useRef<Group>(null);
  const blades = useTuft();
  const size = SIZE[dex] ?? 1.6;
  const lift = HOVER[dex] ?? 0;
  const asleep = dex === 143;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + x * 0.37;
    if (body.current) {
      body.current.position.y = lift
        ? lift + Math.sin(t * 2) * 0.18
        : asleep
          ? 0
          : Math.max(0, Math.sin(t * 2.4)) ** 2 * 0.22;
      if (asleep) body.current.scale.set(size * (1 + Math.sin(t * 1.3) * 0.015), size, 1); // breathing
    }
    if (tuft.current) tuft.current.rotation.set(Math.sin(t * 6) * 0.06, 0, Math.cos(t * 5) * 0.06);
  });

  return (
    <group position={[x, 0, z]}>
      <group onClick={tapObject(spawn.slug)} {...hover}>
        <Shadow size={Math.max(1.4, size * 0.75)} opacity={lift ? 0.6 : 1} />
        {lift ? null : (
          <group ref={tuft} scale={asleep ? 1.8 : 1}>
            <mesh geometry={blades}>
              <meshLambertMaterial color={grass} flatShading />
            </mesh>
          </group>
        )}
        {texture ? (
          <sprite ref={body} center={[0.5, FEET[dex] ?? 0]} scale={[size, size, 1]}>
            <spriteMaterial map={texture} transparent alphaTest={0.08} />
          </sprite>
        ) : null}
      </group>
      {asleep ? <Zzz y={size * 0.9} /> : null}
      <Nameplate text={name} accent="#f6c453" x={x} z={z} y={size + lift + 1.1} />
    </group>
  );
}

let zTexture: CanvasTexture | null = null;
function zzzTexture() {
  if (zTexture) return zTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d")!;
  g.font = "800 52px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 8;
  g.strokeStyle = "#0a2a4a";
  g.strokeText("Z", 32, 34);
  g.fillStyle = "#ffffff";
  g.fillText("Z", 32, 34);
  zTexture = new CanvasTexture(canvas);
  zTexture.colorSpace = SRGBColorSpace;
  return zTexture;
}

/** Three Z's drifting up off a sleeping Pokémon. */
function Zzz({ y }: { y: number }) {
  const group = useRef<Group>(null);
  const map = useMemo(() => zzzTexture(), []);
  useFrame(({ clock }) => {
    group.current?.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.45 + i / 3) % 1;
      child.position.set(0.6 + t * 1.2, y + t * 1.8, 0);
      child.scale.setScalar(0.45 + t * 0.4);
      const sprite = child as Sprite;
      sprite.material.opacity = Math.sin(t * Math.PI);
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <sprite key={i}>
          <spriteMaterial map={map} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}
