"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import { useControls } from "./controls";
import { palettes } from "./palette";
import { Controller } from "./scene/Controller";
import { Objects } from "./scene/objects/Objects";
import { Rings } from "./scene/Rings";
import { TapTarget } from "./scene/TapTarget";
import { Teddy3D } from "./scene/Teddy3D";
import { Trainer3D } from "./scene/Trainer3D";
import { World } from "./scene/World";
import { game } from "./state";
import { useReducedMotion } from "./useReducedMotion";
import { useTimeOfDay } from "./useTimeOfDay";

export default function Game() {
  const time = useTimeOfDay();
  const still = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  useControls(stage);

  return (
    <div
      ref={stage}
      className="absolute inset-0 touch-none select-none"
      role="img"
      aria-label="Tyler's home base, a 3D map in the style of Pokémon GO. Walk with WASD or the arrow keys."
    >
      <Canvas flat dpr={[1, 2]} camera={{ fov: 56, near: 0.3, far: 2500, position: [0, 6.5, 17] }}>
        <Controller />
        <World palette={palettes[time]} night={time === "night"} />
        <TapTarget />
        <Objects grass={palettes[time].leaves[1]} />
        <Rings mover={game.player.trainer} still={still} />
        <Trainer3D mover={game.player.trainer} />
        <Teddy3D mover={game.player.buddy} />
      </Canvas>
    </div>
  );
}
