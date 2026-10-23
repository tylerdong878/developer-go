"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import type { Group } from "three";
import { stops } from "@/content";
import { sfx } from "../../sound";
import { boosted } from "../../species";
import { usePhase } from "../../useTimeOfDay";
import { weatherStore } from "../../weather";
import { game } from "../../state";
import { goTo } from "../../travel";
import { goalId, isOut, LEAVE, moveWild, refreshWild, RUSTLE, wildStore, type WildSpawn } from "../../wild";
import { slots } from "../../base";
import { type Appearing, AppearFx, bodyScale } from "./appear";
import { critterSize, Critter } from "./Critter";

/** When a wild one notices you, and how far it strays from where it appeared. */
const NOTICE = 13;
const ROAM = 4;
const PACE = 1.3;

/**
 * One wild Pokémon. Leaves rustle where it's about to appear and it pops out;
 * then it potters around near there, and when you come close it stops and
 * turns to you (no "!": in the games that's only trainers spotting you, and
 * GO's wild ones get no mark). When its time's up it goes in a puff.
 */
function Wanderer({ s, grass }: { s: WildSpawn; grass: string }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const fx = useRef<Appearing>({ age: -1, going: -1, size: 1, boost: false });
  const popped = useRef(false);
  const home = useRef<[number, number]>([s.x, s.z]);
  const to = useRef<[number, number] | null>(null);
  const rest = useRef((s.id % 5) * 0.4);

  useFrame(({ clock }, frame) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(frame, 0.05);
    const now = clock.elapsedTime;
    const age = now - s.born;
    const going = s.leaving === null ? -1 : (now - s.leaving) / LEAVE;
    // rustle, pop out, and later shrink away into a puff
    fx.current = { age, going, size: Math.max(0.6, critterSize(s.species.dex) * 0.85), boost: boosted(s.species.dex, weatherStore.get()), lured: s.lured };
    if (body.current) body.current.scale.setScalar(bodyScale(fx.current));
    if (!popped.current && age >= RUSTLE) {
      popped.current = true;
      // a soft pop, if it's close enough to hear
      const { position } = game.player.trainer;
      if (Math.hypot(position.x - s.x, position.z - s.z) < 20) sfx.appear();
    }
    const out = isOut(s, now);
    const { position } = game.player.trainer;
    const near = out && Math.hypot(position.x - s.x, position.z - s.z) < NOTICE;
    if (out && !near) {
      rest.current -= dt;
      if (rest.current <= 0 && !to.current) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * ROAM;
        to.current = [home.current[0] + Math.cos(a) * r, home.current[1] + Math.sin(a) * r];
      }
      if (to.current) {
        const dx = to.current[0] - s.x;
        const dz = to.current[1] - s.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.1) {
          to.current = null;
          rest.current = 1.5 + Math.random() * 3;
        } else {
          const step = Math.min(d, PACE * dt);
          const before = s.x;
          moveWild(s.id, s.x + (dx / d) * step, s.z + (dz / d) * step);
          if (before === s.x && Math.abs(dx) > 0.01) to.current = null; // bumped into something
        }
      }
    }
    g.position.set(s.x, 0, s.z);
  });

  return (
    <group ref={root} position={[s.x, 0, s.z]}>
      <group ref={body} scale={0}>
        <Critter
          dex={s.species.dex}
          grass={grass}
          seed={s.id}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta > 6 || !isOut(s)) return;
            e.stopPropagation();
            goTo(goalId(s));
          }}
        />
      </group>
      <AppearFx state={fx} />
    </group>
  );
}

const none: never[] = [];
/** Where the lured stops (the featured projects) stand. */
const LURED: [number, number][] = stops.filter((s) => s.featured && slots[s.slug]).map((s) => slots[s.slug] as [number, number]);

/**
 * Everyday wild Pokémon, just for fun. A few are always out in the grass a
 * short walk away; new ones pop up and old ones wander off as you move, like
 * GO. They wander a little, and notice you when you get close. Tap one to
 * walk over to it.
 */
export function WildSpawns({ grass }: { grass: string }) {
  const list = useSyncExternalStore(wildStore.subscribe, wildStore.get, () => none);
  const last = useRef(-10);
  const night = usePhase() === "night";

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    // nothing spawns behind the start screen: they start trickling in once you're in
    if (game.input.locked || now - last.current < 1) return;
    last.current = now;
    const { position, heading, speed } = game.player.trainer;
    refreshWild(position.x, position.z, now, Math.random, {
      ahead: speed > 1 ? heading : null,
      goal: game.input.goal,
      weather: weatherStore.get(),
      night,
      lures: LURED,
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
