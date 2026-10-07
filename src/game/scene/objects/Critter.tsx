"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ConeGeometry, type Group, type Sprite, Vector3 } from "three";
import { game } from "../../state";
import { POKEMON_3D } from "../pokemon/models";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Shadow } from "../Shadow";
import { hover } from "./tap";
import { useSpriteTexture } from "./useSpriteTexture";

/** Height on the map, by dex number. Big Pokémon are big; floaters hover. */
const SIZE: Record<number, number> = {
  143: 4.6, 95: 5, 100: 1.2, 106: 2.8, 865: 2.6, 56: 2, 133: 1.9, 869: 1.9, 255: 1.8,
  16: 1.6, 19: 1.4, 10: 1.3, 13: 1.3, 129: 1.9, 43: 1.5, 54: 1.9, 60: 1.6, 52: 1.7,
  39: 1.5, 74: 1.7, 66: 2, 58: 2, 25: 1.6, 1: 1.7, 4: 1.7, 7: 1.7, 147: 2.4,
};
const HOVER: Record<number, number> = { 81: 1.1, 479: 1, 137: 0.45, 41: 1.4, 92: 1.2, 74: 0.5 };

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

export const critterSize = (dex: number) => SIZE[dex] ?? 1.6;
export const critterLift = (dex: number) => HOVER[dex] ?? 0;

/**
 * A Pokémon standing on the map: its sprite facing the camera and hopping in
 * rustling grass, or bobbing in the air if it floats. Sleepers breathe.
 */
export function Critter({
  dex,
  grass,
  asleep = false,
  onClick,
  seed = 0,
}: {
  dex: number;
  grass: string;
  asleep?: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  seed?: number;
}) {
  const art = useSpriteTexture(dex);
  const body = useRef<Sprite>(null);
  const tuft = useRef<Group>(null);
  const blades = useTuft();
  const size = critterSize(dex);
  const lift = critterLift(dex);
  const Model = POKEMON_3D[dex];
  const model = useRef<Group>(null);
  const here = useMemo(() => new Vector3(), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed * 0.37;
    const m = model.current;
    if (m) {
      // 3D Pokémon turn to look at you, and hop like the sprites do
      m.getWorldPosition(here);
      const { position } = game.player.trainer;
      const face = Math.atan2(position.x - here.x, position.z - here.z);
      let turn = (face - m.rotation.y) % (Math.PI * 2);
      if (turn > Math.PI) turn -= Math.PI * 2;
      if (turn < -Math.PI) turn += Math.PI * 2;
      m.rotation.y += turn * Math.min(1, dt * (asleep ? 0.5 : 4));
      m.position.y = lift ? lift + Math.sin(t * 2) * 0.18 : asleep ? 0 : Math.max(0, Math.sin(t * 2.4)) ** 2 * 0.22;
    }
    if (body.current) {
      body.current.position.y = lift
        ? lift + Math.sin(t * 2) * 0.18
        : asleep
          ? 0
          : Math.max(0, Math.sin(t * 2.4)) ** 2 * 0.22;
      if (asleep) body.current.scale.set(size * (1 + Math.sin(t * 1.3) * 0.015), size, 1);
    }
    if (tuft.current) tuft.current.rotation.set(Math.sin(t * 6) * 0.06, 0, Math.cos(t * 5) * 0.06);
  });

  return (
    <group onClick={onClick} {...hover}>
      <Shadow size={Math.max(1.4, size * 0.75)} opacity={lift ? 0.6 : 1} />
      {lift ? null : (
        <group ref={tuft} scale={asleep ? 1.8 : 1}>
          <mesh geometry={blades}>
            <meshLambertMaterial color={grass} flatShading />
          </mesh>
        </group>
      )}
      {Model ? (
        <group ref={model} scale={size}>
          <Model asleep={asleep} seed={seed} />
        </group>
      ) : art ? (
        <sprite ref={body} center={[0.5, art.feet]} scale={[size, size, 1]}>
          <spriteMaterial map={art.texture} transparent alphaTest={0.08} />
        </sprite>
      ) : null}
    </group>
  );
}
