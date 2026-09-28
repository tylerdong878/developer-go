"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useState } from "react";
import { palettes } from "./palette";
import { createPlayer } from "./player";
import { Rings } from "./scene/Rings";
import { Teddy3D } from "./scene/Teddy3D";
import { Trainer3D } from "./scene/Trainer3D";
import { World } from "./scene/World";
import { useReducedMotion } from "./useReducedMotion";
import { useTimeOfDay } from "./useTimeOfDay";

/** Frames the trainer from behind. Stands in until the follow camera exists. */
function LookAtTrainer() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => camera.lookAt(0, 1.3, 1), [camera]);
  return null;
}

export default function Game() {
  const time = useTimeOfDay();
  const still = useReducedMotion();
  const [player] = useState(createPlayer);
  return (
    <div className="absolute inset-0" role="img" aria-label="Tyler's home base, a 3D map in the style of Pokémon GO">
      <Canvas flat dpr={[1, 2]} camera={{ fov: 50, near: 0.3, far: 2500, position: [0, 6.5, 17] }}>
        <World palette={palettes[time]} night={time === "night"} />
        <Rings mover={player.trainer} still={still} />
        <Trainer3D mover={player.trainer} />
        <Teddy3D mover={player.buddy} />
        <LookAtTrainer />
      </Canvas>
    </div>
  );
}
