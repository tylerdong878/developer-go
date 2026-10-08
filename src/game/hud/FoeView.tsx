"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { POKEMON_3D } from "../scene/pokemon/models";

function Turning({ dex }: { dex: number }) {
  const g = useRef<Group>(null);
  const Model = POKEMON_3D[dex];
  useFrame(({ clock }) => {
    // a slow look around, like GO's encounter idle
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.35;
  });
  return Model ? (
    <group ref={g}>
      <Model seed={dex} />
    </group>
  ) : null;
}

/**
 * The wild Pokémon in the catch screen: its 3D model in a small scene of its
 * own when it has one, otherwise its sprite. Either way it fills a square box.
 */
export function FoeView({ dex, name, className = "" }: { dex: number; name: string; className?: string }) {
  if (!POKEMON_3D[dex]) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local sprite
      <img src={`/sprites/${dex}.webp`} alt={name} width={200} height={200} className={`object-contain drop-shadow-xl ${className}`} />
    );
  }
  return (
    <div role="img" aria-label={name} className={className}>
      <Canvas flat dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0.62, 2.7], fov: 30 }} onCreated={({ camera }) => camera.lookAt(0, 0.48, 0)}>
        <hemisphereLight args={["#ffffff", "#9fc98a", 1.7]} />
        <directionalLight position={[2, 4, 3]} intensity={1.5} />
        <Turning dex={dex} />
      </Canvas>
    </div>
  );
}
