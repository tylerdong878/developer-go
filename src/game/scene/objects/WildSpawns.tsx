"use client";

import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { CanvasTexture, DoubleSide, type Group, type Mesh, type MeshBasicMaterial, MeshLambertMaterial, ShapeGeometry, Shape, type Sprite, SRGBColorSpace } from "three";
import { game } from "../../state";
import { goTo } from "../../travel";
import { goalId, isOut, LEAVE, moveWild, refreshWild, RUSTLE, wildStore, type WildSpawn } from "../../wild";
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

/** GO's rustling leaves: a little leaf, shared by every spawn. */
const leafShape = new Shape();
leafShape.moveTo(0, -0.26);
leafShape.quadraticCurveTo(0.2, 0, 0, 0.26);
leafShape.quadraticCurveTo(-0.2, 0, 0, -0.26);
const leafGeometry = new ShapeGeometry(leafShape, 4);
const leafMaterials = ["#4ccd63", "#27ae54", "#8fdc5a"].map((c) => new MeshLambertMaterial({ color: c, side: DoubleSide }));
const LEAVES = 12;

/** GO's pop: overshoots a little and settles. */
const backOut = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2);

/**
 * Leaves swirling over the spot while a Pokémon is about to appear, bursting
 * out when it pops up (notes/research/world-2.md 3.2).
 */
function rustle(group: Group, age: number) {
  const burst = age - RUSTLE;
  group.visible = burst < 0.9;
  if (!group.visible) return;
  group.children.forEach((leaf, i) => {
    const a = (i / LEAVES) * Math.PI * 2;
    if (burst < 0) {
      // a small whirl low over the grass, picking up as it nears the pop
      const spin = a + age * (5 + age * 3);
      const r = 0.45 + Math.sin(age * 7 + i) * 0.15;
      leaf.position.set(Math.cos(spin) * r, 0.15 + Math.abs(Math.sin(age * 6 + i * 1.7)) * (0.3 + age * 0.25), Math.sin(spin) * r);
      leaf.rotation.set(age * 9 + i, age * 7, i);
      leaf.scale.setScalar(Math.min(1, age * 3));
    } else {
      // flung out and drifting down as they shrink away
      const r = 0.6 + burst * 3.2;
      leaf.position.set(Math.cos(a + 0.3) * r, 0.5 + burst * 2.2 - burst * burst * 3.4, Math.sin(a + 0.3) * r);
      leaf.rotation.set(burst * 12 + i, burst * 8, i);
      leaf.scale.setScalar(Math.max(0, 1 - burst / 0.9));
    }
  });
}

/**
 * One wild Pokémon. Leaves rustle where it's about to appear and it pops out;
 * then it potters around near there, and when you come close it stops and a
 * "!" pops up over it, like the games. When its time's up it goes in a puff.
 */
function Wanderer({ s, grass }: { s: WildSpawn; grass: string }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const leaves = useRef<Group>(null);
  const puff = useRef<Mesh>(null);
  const mark = useRef<Sprite>(null);
  const home = useRef<[number, number]>([s.x, s.z]);
  const to = useRef<[number, number] | null>(null);
  const rest = useRef((s.id % 5) * 0.4);
  const seen = useRef(false);
  const pop = useRef(0);

  useFrame(({ clock }, frame) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(frame, 0.05);
    const now = clock.elapsedTime;
    const age = now - s.born;
    const going = s.leaving === null ? -1 : (now - s.leaving) / LEAVE;
    // rustle, pop out, and later shrink away into a puff
    if (body.current) body.current.scale.setScalar(going >= 0 ? Math.max(0, 1 - going * going) : backOut((age - RUSTLE) / 0.35));
    if (leaves.current) rustle(leaves.current, age);
    if (puff.current) {
      puff.current.visible = going >= 0 && going < 1;
      if (puff.current.visible) {
        puff.current.scale.setScalar(0.6 + going * 1.6);
        (puff.current.material as MeshBasicMaterial).opacity = 0.75 * (1 - going);
      }
    }
    const out = isOut(s, now);
    const { position } = game.player.trainer;
    const near = out && Math.hypot(position.x - s.x, position.z - s.z) < NOTICE;
    if (near && !seen.current) pop.current = 1.4;
    seen.current = near;
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
      <group ref={leaves}>
        {Array.from({ length: LEAVES }, (_, i) => (
          <mesh key={i} geometry={leafGeometry} material={leafMaterials[i % leafMaterials.length]} scale={0} />
        ))}
      </group>
      <mesh ref={puff} position-y={0.7} visible={false}>
        <sphereGeometry args={[0.8, 16, 12]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
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
    // nothing spawns behind the start screen: they start trickling in once you're in
    if (game.input.locked || now - last.current < 1) return;
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
