"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { BoxGeometry, type Group, MeshLambertMaterial, SphereGeometry } from "three";
import { sfx } from "../../sound";
import { boosted } from "../../species";
import { usePhase } from "../../useTimeOfDay";
import { weatherStore } from "../../weather";
import { game } from "../../state";
import { goTo } from "../../travel";
import { progressStore } from "../../progress";
import { goalId, isOut, LEAVE, refreshWild, RUSTLE, wildStore, type WildSpawn } from "../../wild";
import { type Appearing, AppearFx, bodyScale } from "./appear";
import { critterSize, Critter } from "./Critter";

/**
 * One wild Pokémon on its spawn point. If it fires while you're there, leaves
 * rustle and it pops out; then it idles in place, turning to you and hopping
 * now and then, like GO's (they don't wander, and get no "!"). When its time's
 * up it goes in a puff. Ditto looks like its disguise until it's caught.
 */
/** Halloween's spooky surprise, our own box: orange with a purple lid and ribbon, a bow, a jack-o'-lantern grin. */
const boxBody = new BoxGeometry(0.62, 0.5, 0.62).translate(0, 0.25, 0);
const boxLid = new BoxGeometry(0.7, 0.14, 0.7).translate(0, 0.55, 0);
const ribbonX = new BoxGeometry(0.66, 0.52, 0.12).translate(0, 0.26, 0);
const ribbonZ = new BoxGeometry(0.12, 0.52, 0.66).translate(0, 0.26, 0);
const bow = new SphereGeometry(0.11, 10, 8);
const eye = new BoxGeometry(0.1, 0.1, 0.02);
const mouth = new BoxGeometry(0.28, 0.06, 0.02);
const ORANGE = new MeshLambertMaterial({ color: "#f07a18" });
const PURPLE = new MeshLambertMaterial({ color: "#7a3fc0" });
const FACE = new MeshLambertMaterial({ color: "#3a1a08", emissive: "#ffb040", emissiveIntensity: 0.25 });

function SurpriseBox({ seed, onClick }: { seed: number; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const box = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    if (!box.current) return;
    // a little hop and a wiggle now and then, like something's inside
    const hop = Math.max(0, Math.sin(t * 2.2)) ** 6;
    box.current.position.y = hop * 0.18;
    box.current.rotation.z = Math.sin(t * 9) * 0.08 * hop;
    box.current.rotation.y = seed + t * 0.25;
  });
  return (
    <group ref={box} onClick={onClick} scale={1.2}>
      <mesh geometry={boxBody} material={ORANGE} castShadow />
      <mesh geometry={ribbonX} material={PURPLE} />
      <mesh geometry={ribbonZ} material={PURPLE} />
      <mesh geometry={boxLid} material={PURPLE} castShadow />
      <mesh geometry={bow} material={PURPLE} position={[-0.1, 0.68, 0]} scale={[1, 0.7, 0.7]} />
      <mesh geometry={bow} material={PURPLE} position={[0.1, 0.68, 0]} scale={[1, 0.7, 0.7]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={eye} material={FACE} position={[s * 0.13, 0.33, 0.315]} rotation={[0, 0, Math.PI / 4]} />
      ))}
      <mesh geometry={mouth} material={FACE} position={[0, 0.17, 0.315]} />
    </group>
  );
}

function Wanderer({ s, grass }: { s: WildSpawn; grass: string }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const fx = useRef<Appearing>({ age: -1, going: -1, size: 1, boost: false });
  const popped = useRef(false);
  const looks = s.looks?.dex ?? s.species.dex;
  const seed = [...s.id].reduce((n, c) => n + c.charCodeAt(0), 0);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const now = clock.elapsedTime;
    const age = now - s.born;
    const going = s.leaving === null ? -1 : (now - s.leaving) / LEAVE;
    // rustle, pop out, and later shrink away into a puff
    fx.current = { age, going, size: Math.max(0.6, critterSize(looks) * 0.85), boost: boosted(looks, weatherStore.get()), lured: s.lured, daily: s.daily };
    if (body.current) body.current.scale.setScalar(bodyScale(fx.current));
    if (!popped.current && age >= RUSTLE) {
      popped.current = true;
      // a soft pop, if it's close enough to hear
      const { position } = game.player.trainer;
      if (Math.hypot(position.x - s.x, position.z - s.z) < 20) sfx.appear();
    }
    g.position.set(s.x, 0, s.z);
  });

  return (
    <group ref={root} position={[s.x, 0, s.z]}>
      <group ref={body} scale={0}>
        {s.surprise ? (
          <SurpriseBox
            seed={seed}
            onClick={(e) => {
              if (e.delta > 6 || !isOut(s)) return;
              e.stopPropagation();
              goTo(goalId(s));
            }}
          />
        ) : (
          <Critter
            dex={looks}
            grass={grass}
            seed={seed}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta > 6 || !isOut(s)) return;
              e.stopPropagation();
              goTo(goalId(s));
            }}
          />
        )}
      </group>
      <AppearFx state={fx} />
    </group>
  );
}

const none: never[] = [];

/**
 * The wild Pokémon round the trainer, from GO-style spawn points (../../wild.ts):
 * busy in the park and by the water, quieter on the streets, the same for
 * everyone at the same moment. Tap one to walk over to it.
 */
export function WildSpawns({ grass }: { grass: string }) {
  const list = useSyncExternalStore(wildStore.subscribe, wildStore.get, () => none);
  const last = useRef(-10);
  const night = usePhase() === "night";

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - last.current < 1) return;
    last.current = now;
    const { position, heading } = game.player.trainer;
    refreshWild(position.x, position.z, now, {
      goal: game.input.goal,
      weather: weatherStore.get(),
      night,
      heading,
      caught: progressStore.get().caught,
      fresh: progressStore.get().history.length === 0,
      incense: progressStore.get().incenseUntil,
      adventure: progressStore.get().incenseKind === "daily",
    });
  });

  return (
    <>
      {list.map((s) => (
        <Wanderer key={s.id} s={s} grass={grass} />
      ))}
    </>
  );
}
