"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { CanvasTexture, type Group, type Sprite, SRGBColorSpace } from "three";
import { game } from "../../state";
import { goTo } from "../../travel";
import { goalId, moveWild, refreshWild, wildStore, type WildSpawn } from "../../wild";
import { critterLift, critterSize, Critter } from "./Critter";

/** When a wild one notices you, and how far it strays from where it appeared. */
const NOTICE = 13;
const ROAM = 4;
const PACE = 1.3;

/** The "!" a Pokémon gets when it spots you, drawn once and shared. */
let alertMark: CanvasTexture | null = null;
function alertTexture() {
  if (alertMark) return alertMark;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(48, 48, 42, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#e3350d";
  g.lineWidth = 6;
  g.stroke();
  g.fillStyle = "#e3350d";
  g.font = "900 64px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("!", 48, 52);
  alertMark = new CanvasTexture(c);
  alertMark.colorSpace = SRGBColorSpace;
  return alertMark;
}

/**
 * One wild Pokémon: it potters around near where it appeared, and when you
 * come close it stops and a "!" pops up over it, like the games.
 */
function Wanderer({ s, grass }: { s: WildSpawn; grass: string }) {
  const root = useRef<Group>(null);
  const mark = useRef<Sprite>(null);
  const home = useRef<[number, number]>([s.x, s.z]);
  const to = useRef<[number, number] | null>(null);
  const rest = useRef((s.id % 5) * 0.4);
  const seen = useRef(false);
  const pop = useRef(0);

  useFrame((_, frame) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(frame, 0.05);
    const { position } = game.player.trainer;
    const near = Math.hypot(position.x - s.x, position.z - s.z) < NOTICE;
    if (near && !seen.current) pop.current = 1.4;
    seen.current = near;
    if (!near) {
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
    pop.current = Math.max(0, pop.current - dt);
    if (mark.current) {
      const k = pop.current > 0 ? Math.min(1, (1.4 - pop.current) * 8, pop.current * 4) : 0;
      mark.current.visible = k > 0.01;
      mark.current.scale.setScalar(0.9 * k);
      mark.current.position.y = critterLift(s.species.dex) + critterSize(s.species.dex) + 0.5 + Math.sin(k * Math.PI) * 0.15;
    }
  });

  return (
    <group ref={root} position={[s.x, 0, s.z]}>
      <Critter
        dex={s.species.dex}
        grass={grass}
        seed={s.id}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta > 6) return;
          e.stopPropagation();
          goTo(goalId(s));
        }}
      />
      <sprite ref={mark} visible={false} renderOrder={7}>
        <spriteMaterial map={alertTexture()} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

const none: never[] = [];

/**
 * Everyday wild Pokémon, just for fun. A few are always out in the grass a
 * short walk away; new ones pop up and old ones wander off as you move, like
 * GO. They wander a little, and notice you when you get close. Tap one to
 * walk over to it.
 */
export function WildSpawns({ grass }: { grass: string }) {
  const list = useSyncExternalStore(wildStore.subscribe, wildStore.get, () => none);
  const last = useRef(-10);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - last.current < 1) return;
    last.current = now;
    const { x, z } = game.player.trainer.position;
    refreshWild(x, z, now);
  });

  return (
    <>
      {list.map((s) => (
        <Wanderer key={s.id} s={s} grass={grass} />
      ))}
    </>
  );
}
