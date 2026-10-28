"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useControls } from "./controls";
import { Hud } from "./hud/Hud";
import { palettes } from "./palette";
import { renderBudget, saverStore, watchBattery } from "./device";
import { Balls } from "./scene/Balls";
import { Controller } from "./scene/Controller";
import { Objects } from "./scene/objects/Objects";
import { RouteLine } from "./scene/RouteLine";
import { IncenseCloud } from "./scene/Incense";
import { Rings } from "./scene/Rings";
import { TapTarget } from "./scene/TapTarget";
import { Teddy3D } from "./scene/Teddy3D";
import { Trainer3D } from "./scene/Trainer3D";
import { Dust } from "./scene/Dust";
import { Npcs } from "./scene/Npcs";
import { AdaptiveDpr, Throttle, WarmUp } from "./scene/Perf";
import { CastShadows } from "./scene/Sun";
import { patchLook } from "./scene/look";
import { World } from "./scene/World";
import { game } from "./state";
import { startedStore } from "./ready";
import { useReducedMotion } from "./useReducedMotion";
import { usePhase } from "./useTimeOfDay";

// one sun, colored shadows: patched into three before anything compiles
patchLook();

export default function Game() {
  const phase = usePhase();
  const still = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  // the battery saver can change while you play: what can follow it does
  const saver = useSyncExternalStore(saverStore.subscribe, saverStore.get, saverStore.server);
  const saving = saver.endsWith(":true");
  const budget = useMemo(() => renderBudget(saving), [saving]);
  useEffect(watchBattery, []);
  useControls(stage);
  // nothing moves (or spawns) until the visitor starts
  const started = useSyncExternalStore(startedStore.subscribe, startedStore.get, startedStore.server);
  useEffect(() => {
    game.input.locked = !started;
  }, [started]);

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
          onCreated={({ gl }) => {
            // checking each shader's log waits for it to finish compiling, which blocks the page as it loads (notes/research/perf.md)
            if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false;
          }}
        >
          <WarmUp />
          <Throttle />
          <AdaptiveDpr range={budget.dpr} />
          <Controller />
          <World phase={phase} shadowMap={budget.shadowMap} light={budget.light} />
          <TapTarget />
          <CastShadows>
            <Objects grass={palettes[phase].leaves[1]} />
            <RouteLine />
            <IncenseCloud />
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
