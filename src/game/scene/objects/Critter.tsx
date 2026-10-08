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

/**
 * Height on the map, by dex number, from Pokémon GO's own game data
 * (modelHeight x modelScale, with Pikachu at 1.6). GO squeezes the range:
 * tiny bugs come out about twice their real size and Snorlax well under it,
 * which is why its map reads so well. Rotom is nudged up so it stays visible;
 * Alcremie isn't in the data, so it keeps a hand-picked size.
 */
const SIZE: Record<number, number> = {
  1: 2.06, 4: 2.03, 7: 1.78, 25: 1.6, 16: 1.36, 19: 1.43, 10: 1.05, 13: 1.02, 41: 2.46,
  129: 2.46, 43: 1.82, 54: 2.36, 60: 2.03, 52: 1.73, 39: 1.94, 74: 3.24, 66: 2.38,
  58: 2.21, 92: 2.7, 63: 2.33, 147: 2.34, 143: 4.0, 106: 3.23, 865: 2.55, 95: 7.3,
  137: 2.38, 479: 1.2, 133: 1.36, 56: 1.92, 100: 1.82, 869: 1.9, 132: 1.44, 255: 1.6, 81: 1.56,
};
/** Floaters: how high they hover (Gastly at your eye level, Abra just off the ground). */
const HOVER: Record<number, number> = { 81: 1.1, 479: 1, 137: 0.45, 41: 1.4, 92: 0.6, 74: 1, 63: 0.3 };
/**
 * GO's idle rhythm from its game data: seconds between moves, and how long
 * a hop lasts. Most hop about once every 10 s and stand still in between;
 * Charmander, Meowth and Mankey only every 29 s; Ditto and Magikarp never.
 */
const HOP: Record<number, readonly [every: number, lasts: number]> = {
  4: [29, 1.25], 52: [29, 1], 56: [29, 1], 66: [23, 1], 106: [11, 0.8], 255: [11, 1.1],
  1: [10, 1.15], 16: [10, 1.4], 19: [10, 0.9], 13: [10, 1.25], 147: [10, 0.85], 133: [10, 1.35],
  865: [10, 0.9], 100: [10, 1.2], 39: [10, 1.4], 132: [Infinity, 1], 129: [Infinity, 1],
};
/** Height off the ground right now: one quick hop every so often, otherwise standing. */
function hopAt(dex: number, t: number, size: number) {
  const [every, lasts] = HOP[dex] ?? [10, 1];
  if (!Number.isFinite(every)) return 0;
  const phase = t % every;
  return phase < lasts ? Math.sin((Math.PI * phase) / lasts) * 0.12 * size : 0;
}

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
      // 3D Pokémon turn to look at you, and hop now and then like GO's
      m.getWorldPosition(here);
      const { position } = game.player.trainer;
      const face = Math.atan2(position.x - here.x, position.z - here.z);
      let turn = (face - m.rotation.y) % (Math.PI * 2);
      if (turn > Math.PI) turn -= Math.PI * 2;
      if (turn < -Math.PI) turn += Math.PI * 2;
      m.rotation.y += turn * Math.min(1, dt * (asleep ? 0.5 : 4));
      m.position.y = lift ? lift + Math.sin(t * 2) * 0.18 : asleep ? 0 : hopAt(dex, t + seed * 3.1, size);
    }
    if (body.current) {
      body.current.position.y = lift
        ? lift + Math.sin(t * 2) * 0.18
        : asleep
          ? 0
          : hopAt(dex, t + seed * 3.1, size);
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
