"use client";

import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useControls } from "./controls";
import { Hud } from "./hud/Hud";
import { palettes } from "./palette";
import { renderBudget } from "./device";
import { markReady } from "./ready";
import { Balls } from "./scene/Balls";
import { Controller } from "./scene/Controller";
import { Objects } from "./scene/objects/Objects";
import { Rings } from "./scene/Rings";
import { TapTarget } from "./scene/TapTarget";
import { Teddy3D } from "./scene/Teddy3D";
import { Trainer3D } from "./scene/Trainer3D";
import { Dust } from "./scene/Dust";
import { Npcs } from "./scene/Npcs";
import { CastShadows } from "./scene/Sun";
import { World } from "./scene/World";
import { game } from "./state";
import { useReducedMotion } from "./useReducedMotion";
import { useTimeOfDay } from "./useTimeOfDay";

export default function Game() {
  const time = useTimeOfDay();
  const still = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [budget] = useState(renderBudget);
  useControls(stage);

  return (
    <>
      <div
        ref={stage}
        className="absolute inset-0 touch-none select-none"
        role="img"
        aria-label="Tyler's home base, a 3D map in the style of Pokémon GO. Walk with WASD or the arrow keys."
      >
        <Canvas
          flat
          shadows="percentage"
          dpr={budget.dpr}
          camera={{ fov: 56, near: 0.3, far: 2500, position: [0, 6.5, 17] }}
          onCreated={() => requestAnimationFrame(() => requestAnimationFrame(markReady))}
        >
          <Controller />
          <World palette={palettes[time]} night={time === "night"} shadowMap={budget.shadowMap} light={budget.light} />
          <TapTarget />
          <CastShadows>
            <Objects grass={palettes[time].leaves[1]} />
          </CastShadows>
          <Balls />
          <Rings mover={game.player.trainer} still={still} />
          <Dust />
          <CastShadows>
            <Trainer3D mover={game.player.trainer} />
            <Teddy3D mover={game.player.buddy} />
            <Npcs few={budget.light} />
          </CastShadows>
        </Canvas>
      </div>
      <Hud />
    </>
  );
}
