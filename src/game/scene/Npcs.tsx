"use client";

import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  type Group,
  SphereGeometry,
  type Sprite,
  SRGBColorSpace,
  TorusGeometry,
} from "three";
import { places } from "../base";
import { circle, ellipse, type Vec2 } from "../geometry";
import { game } from "../state";

/*
 * People around town, as Let's Go's trainer classes (notes/research/world-npcs.md):
 * a Youngster in shorts, a Bug Catcher with his net, a Fisherman with a rod,
 * an Ace Trainer, a Black Belt. Like trainers in the games, each one spots
 * you once: a "!" pops, they walk up, and say their line (which points you at
 * part of the portfolio). After that they just stop and wave. Nurse Joy and
 * the Mart clerk stand at their doors and greet you, no "!", like town staff.
 */

type Look = {
  skin: string;
  hair: string;
  torso: string;
  arms: string;
  legs: string;
  shoes: string;
  /** Extra parts on the head, body, or in the right hand, built for this class. */
  head?: ReactNode;
  body?: ReactNode;
  hand?: ReactNode;
  tall?: number;
};

type Npc = { route: Vec2[]; loop: boolean; line: string; look: Look; speed: number; staff?: { at: Vec2; turn: number } };

const ball = new SphereGeometry(1, 16, 12);
const dome = new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
const box = new BoxGeometry(1, 1, 1);
const cyl = new CylinderGeometry(1, 1, 1, 14);
const ring = new TorusGeometry(1, 0.12, 6, 20);
const cone = new ConeGeometry(1, 1, 10);
const leg = new CapsuleGeometry(0.12, 0.58, 4, 10);
const torsoGeo = new CapsuleGeometry(0.3, 0.42, 4, 12);
const armGeo = new CapsuleGeometry(0.09, 0.45, 4, 8);

type V3 = [number, number, number];
function M({ g, c, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0] }: { g: BufferGeometry; c: string; p?: V3; s?: V3 | number; r?: V3 }) {
  return (
    <mesh geometry={g} position={p} scale={s} rotation={r} castShadow>
      <meshLambertMaterial color={c} />
    </mesh>
  );
}

/** A ball cap: a dome and a brim, head-relative. */
const cap = (c: string, brim: string) => (
  <>
    <M g={dome} c={c} p={[0, 0.06, 0]} s={[0.34, 0.3, 0.34]} />
    <M g={box} c={brim} p={[0, 0.08, 0.3]} s={[0.3, 0.03, 0.22]} />
  </>
);

const LOOKS = {
  youngster: {
    skin: "#f6cdae",
    hair: "#4d504b",
    torso: "#f3f6f2",
    arms: "#f8d652",
    legs: "#f6cdae",
    shoes: "#5888b8",
    head: cap("#3c84cb", "#2c5a8e"),
    body: <M g={cyl} c="#c9a978" p={[0, 0.72, 0]} s={[0.3, 0.3, 0.24]} />,
  },
  bugCatcher: {
    skin: "#f2cdb1",
    hair: "#6b4a2e",
    torso: "#708e53",
    arms: "#f2cdb1",
    legs: "#f2cdb1",
    shoes: "#5b6c77",
    head: (
      <>
        <M g={dome} c="#f7f4d4" p={[0, 0.07, 0]} s={[0.35, 0.32, 0.35]} />
        <M g={cyl} c="#f7f4d4" p={[0, 0.08, 0]} s={[0.5, 0.03, 0.5]} />
        <M g={cyl} c="#769556" p={[0, 0.13, 0]} s={[0.35, 0.06, 0.35]} />
      </>
    ),
    body: (
      <>
        <M g={cyl} c="#677986" p={[0, 0.72, 0]} s={[0.3, 0.3, 0.24]} />
        <M g={box} c="#be6354" p={[0.3, 0.95, 0.06]} s={[0.16, 0.14, 0.08]} />
      </>
    ),
    // the bug net over the shoulder: the net is the silhouette
    hand: (
      <group position={[0, -0.5, 0]} rotation={[-0.5, 0, 0]}>
        <M g={cyl} c="#a07850" p={[0, 0.55, 0]} s={[0.015, 1.3, 0.015]} />
        <M g={ring} c="#d1d3d1" p={[0, 1.25, 0]} r={[Math.PI / 2, 0, 0]} s={0.18} />
        <mesh geometry={cone} position={[0, 1.1, 0]} rotation={[Math.PI, 0, 0]} scale={[0.17, 0.3, 0.17]}>
          <meshLambertMaterial color="#f3f4eb" transparent opacity={0.7} />
        </mesh>
      </group>
    ),
  },
  fisherman: {
    skin: "#f3cbaf",
    hair: "#5a4a3a",
    torso: "#f4714d",
    arms: "#cfcfd0",
    legs: "#b4a88e",
    shoes: "#50554b",
    head: (
      <>
        {cap("#f4714d", "#d85a38")}
        <M g={ring} c="#33332f" p={[0, 0.1, 0]} r={[Math.PI / 2, 0, 0]} s={[0.33, 0.33, 0.3]} />
      </>
    ),
    // the hi-vis stripes on the vest, and green rubber boots
    body: (
      <>
        <M g={box} c="#c6b048" p={[0, 1.42, 0.27]} s={[0.5, 0.05, 0.06]} />
        <M g={box} c="#c6b048" p={[0, 1.22, 0.29]} s={[0.5, 0.05, 0.06]} />
        <M g={cyl} c="#50554b" p={[0.13, 0.22, 0]} s={[0.14, 0.42, 0.14]} />
        <M g={cyl} c="#50554b" p={[-0.13, 0.22, 0]} s={[0.14, 0.42, 0.14]} />
      </>
    ),
    hand: (
      <group position={[0, -0.5, 0.1]} rotation={[0.9, 0, 0]}>
        <M g={cyl} c="#33332f" p={[0, 0.8, 0]} s={[0.012, 1.6, 0.012]} />
        <M g={cyl} c="#8a8a84" p={[0.05, 0.25, 0]} r={[0, 0, Math.PI / 2]} s={[0.05, 0.05, 0.05]} />
      </group>
    ),
  },
  ace: {
    skin: "#f6cab3",
    hair: "#b6706b",
    torso: "#4f556e",
    arms: "#4f556e",
    legs: "#474b55",
    shoes: "#333333",
    tall: 1.06,
  },
  blackBelt: {
    skin: "#f4c9a9",
    hair: "#4d4d48",
    torso: "#f7f5f0",
    arms: "#f7f5f0",
    legs: "#f7f5f0",
    shoes: "#f4c9a9",
    head: (
      <>
        <M g={ring} c="#fcfbfa" p={[0, 0.05, 0]} r={[Math.PI / 2, 0, 0]} s={[0.25, 0.25, 0.2]} />
        {[-0.12, 0, 0.12].map((x) => (
          <M key={x} g={cone} c="#4d4d48" p={[x, 0.25, -0.02]} s={[0.07, 0.16, 0.07]} r={[0, 0, -x]} />
        ))}
      </>
    ),
    body: (
      <>
        <M g={ring} c="#4d4d48" p={[0, 1.02, 0]} r={[Math.PI / 2, 0, 0]} s={[0.31, 0.31, 0.3]} />
        <M g={box} c="#4d4d48" p={[0.08, 0.9, 0.3]} s={[0.05, 0.22, 0.03]} r={[0, 0, 0.2]} />
      </>
    ),
    hand: <M g={cyl} c="#973c34" p={[0, -0.5, 0]} s={[0.1, 0.08, 0.1]} />,
  },
  joy: {
    skin: "#f5d0c0",
    hair: "#f39cbf",
    torso: "#fad7ec",
    arms: "#fad7ec",
    legs: "#f5d0c0",
    shoes: "#f6f6f6",
    head: (
      <>
        {/* the two big hair loops, and the nurse cap with its red cross */}
        <M g={ring} c="#f39cbf" p={[0.27, -0.08, -0.04]} r={[0, Math.PI / 2, 0]} s={[0.13, 0.13, 0.3]} />
        <M g={ring} c="#f39cbf" p={[-0.27, -0.08, -0.04]} r={[0, Math.PI / 2, 0]} s={[0.13, 0.13, 0.3]} />
        <M g={box} c="#f6fcfd" p={[0, 0.27, 0.04]} s={[0.3, 0.12, 0.14]} />
        <M g={box} c="#e03c3c" p={[0, 0.27, 0.115]} s={[0.08, 0.025, 0.01]} />
        <M g={box} c="#e03c3c" p={[0, 0.27, 0.115]} s={[0.025, 0.08, 0.01]} />
      </>
    ),
    body: (
      <>
        <M g={cyl} c="#fad7ec" p={[0, 0.82, 0]} s={[0.36, 0.38, 0.32]} />
        <M g={box} c="#f2f6f8" p={[0, 1.05, 0.25]} s={[0.4, 0.6, 0.04]} />
      </>
    ),
  },
  clerk: {
    skin: "#f2c39c",
    hair: "#4b4d4f",
    torso: "#bedeee",
    arms: "#bedeee",
    legs: "#3e4652",
    shoes: "#2c2c2c",
    head: (
      <>
        <M g={ring} c="#2a2a2a" p={[0.09, -0.02, 0.24]} s={[0.06, 0.06, 0.06]} />
        <M g={ring} c="#2a2a2a" p={[-0.09, -0.02, 0.24]} s={[0.06, 0.06, 0.06]} />
      </>
    ),
    body: <M g={box} c="#3892d2" p={[0, 1.08, 0.27]} s={[0.46, 0.62, 0.04]} />,
  },
} satisfies Record<string, Look>;

const NPCS: Npc[] = [
  {
    route: [[3.5, -22], [3.5, -92]],
    loop: false,
    line: "Gyms downtown are Tyler's jobs. I'm taking on the tall glass tower. That's AWS!",
    look: LOOKS.ace,
    speed: 2.6,
  },
  {
    route: [[76.5, -60], [76.5, 60]],
    loop: false,
    line: "Be patient! The PokéStops by the harbor are his quant projects. Spin one and see what bites.",
    look: LOOKS.fisherman,
    speed: 2.2,
  },
  {
    route: [[-60, 37], [30, 37]],
    loop: false,
    line: "Hoargh! Raids are his hackathons. The two by the roundabout hit hardest!",
    look: LOOKS.blackBelt,
    speed: 2.8,
  },
  {
    route: ellipse(-95, -2, 34, 24, 24),
    loop: true,
    line: "Hey, wait up! The sparkly ones in the grass know stuff about Tyler. Catch one!",
    look: LOOKS.bugCatcher,
    speed: 2.3,
  },
  {
    route: circle(0, 0, 13.2, 24),
    loop: true,
    line: "Hi! I like shorts! Also, tap the map in the corner to go anywhere.",
    look: LOOKS.youngster,
    speed: 1.8,
  },
];

const centerDoor = places["place:center"] ?? [12, -17.5];
const martDoor = places["place:mart"] ?? [-12, -18.8];

/** Town staff, standing by their doors. */
const STAFF: Npc[] = [
  {
    route: [],
    loop: false,
    line: "Welcome to our Pokémon Center! Come on in to meet Tyler.",
    look: LOOKS.joy,
    speed: 0,
    staff: { at: [centerDoor[0] + 2.6, centerDoor[1] - 1], turn: 0 },
  },
  {
    route: [],
    loop: false,
    line: "Hi there! May I help you? Your items are inside.",
    look: LOOKS.clerk,
    speed: 0,
    staff: { at: [martDoor[0] - 2.6, martDoor[1] - 0.6], turn: 0 },
  },
];

/** When a trainer spots you, how close they come to talk, and how far you go before they head back. */
const SPOT = 10;
const TALK = 3.4;
const LEAVE = 13;

/** A speech bubble, drawn once into a texture. */
function bubbleTexture(text: string) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-lato") || "sans-serif";
  const font = `700 30px ${family}`;
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d")!;
  g.font = font;
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > 420 && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  lines.push(line);
  const width = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + 48;
  const height = lines.length * 38 + 36 + 18;
  canvas.width = width;
  canvas.height = height;
  g.font = font;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(2, 2, width - 4, height - 22, 22);
  g.fill();
  g.beginPath();
  g.moveTo(width / 2 - 14, height - 21);
  g.lineTo(width / 2, height - 2);
  g.lineTo(width / 2 + 14, height - 21);
  g.fill();
  g.fillStyle = "#30555d";
  g.textBaseline = "top";
  lines.forEach((l, i) => g.fillText(l, 24, 20 + i * 38));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, aspect: width / height };
}

/** The "!" a trainer gets when they spot you, drawn once and shared. */
let spotted: CanvasTexture | null = null;
function spottedTexture() {
  if (spotted) return spotted;
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(14, 6, 68, 74, 18);
  g.fill();
  g.beginPath();
  g.moveTo(40, 78);
  g.lineTo(48, 92);
  g.lineTo(56, 78);
  g.fill();
  g.fillStyle = "#1c2a3a";
  g.font = "900 62px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("!", 48, 46);
  spotted = new CanvasTexture(c);
  spotted.colorSpace = SRGBColorSpace;
  return spotted;
}

/** Where along a route someone is after walking `d` meters (ping-ponging if the route isn't a loop). */
function along(route: Vec2[], loop: boolean, d: number): { at: Vec2; dir: Vec2 } {
  const legs: [Vec2, Vec2][] = [];
  for (let i = 0; i < route.length - (loop ? 0 : 1); i++) legs.push([route[i], route[(i + 1) % route.length]]);
  const lengths = legs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lengths.reduce((s, l) => s + l, 0);
  let t = d % (loop ? total : total * 2);
  let back = false;
  if (!loop && t > total) {
    t = total * 2 - t;
    back = true;
  }
  for (let i = 0; i < legs.length; i++) {
    if (t <= lengths[i] || i === legs.length - 1) {
      const [a, b] = legs[i];
      const k = Math.min(1, t / lengths[i]);
      const dir: Vec2 = [((b[0] - a[0]) / lengths[i]) * (back ? -1 : 1), ((b[1] - a[1]) / lengths[i]) * (back ? -1 : 1)];
      return { at: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], dir };
    }
    t -= lengths[i];
  }
  return { at: route[0], dir: [0, 1] };
}

function Person({ npc, seed }: { npc: Npc; seed: number }) {
  const root = useRef<Group>(null);
  const bubble = useRef<Sprite>(null);
  const mark = useRef<Sprite>(null);
  const walked = useRef(seed * 37);
  const offset = useRef<[number, number]>([0, 0]);
  const met = useRef(false);
  const alertFor = useRef(0);
  const shown = useRef(0);
  const phase = useRef(0);
  const [plate, setPlate] = useState<{ texture: CanvasTexture; aspect: number } | null>(null);
  const { look } = npc;
  const tall = look.tall ?? 1;

  useEffect(() => {
    const id = window.setTimeout(() => setPlate(bubbleTexture(npc.line)), 400 + seed * 120);
    return () => window.clearTimeout(id);
  }, [npc.line, seed]);
  useEffect(() => () => plate?.texture.dispose(), [plate]);

  useFrame(({ clock }, frame) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(frame, 0.05);
    const { position } = game.player.trainer;
    const route = npc.staff
      ? { at: npc.staff.at, dir: [Math.sin(npc.staff.turn), Math.cos(npc.staff.turn)] as Vec2 }
      : along(npc.route, npc.loop, walked.current);
    const x = route.at[0] + offset.current[0];
    const z = route.at[1] + offset.current[1];
    const dx = position.x - x;
    const dz = position.z - z;
    const d = Math.hypot(dx, dz);

    let talking = false;
    let moving = false;
    if (npc.staff) {
      talking = d < 7;
    } else if (!met.current && d < SPOT) {
      // spotted: a "!", then they walk up to you, then they talk
      if (alertFor.current === 0) alertFor.current = 0.7;
      alertFor.current = Math.max(0.0001, alertFor.current - dt);
      if (alertFor.current <= 0.0001 && d > TALK) {
        const step = Math.min(d - TALK, 3.2 * dt);
        offset.current = [offset.current[0] + (dx / d) * step, offset.current[1] + (dz / d) * step];
        moving = true;
      }
      if (d <= TALK + 0.05) {
        met.current = true;
        talking = true;
      }
    } else if (met.current && d < LEAVE - 4) {
      talking = true;
    } else {
      // back to the route if they stepped off it, then carry on walking it
      const o = Math.hypot(offset.current[0], offset.current[1]);
      if (o > 0.05) {
        const step = Math.min(o, 2.4 * dt);
        offset.current = [offset.current[0] - (offset.current[0] / o) * step, offset.current[1] - (offset.current[1] / o) * step];
      } else {
        offset.current = [0, 0];
        walked.current += npc.speed * dt;
      }
      moving = !npc.staff;
      if (d > LEAVE) alertFor.current = 0;
    }

    g.position.set(x, 0, z);
    const returning = Math.hypot(offset.current[0], offset.current[1]) > 0.05;
    const face =
      talking || (alertFor.current > 0 && !met.current)
        ? Math.atan2(dx, dz)
        : returning
          ? Math.atan2(-offset.current[0], -offset.current[1])
          : Math.atan2(route.dir[0], route.dir[1]);
    let turn = (face - g.rotation.y) % (Math.PI * 2);
    if (turn > Math.PI) turn -= Math.PI * 2;
    if (turn < -Math.PI) turn += Math.PI * 2;
    g.rotation.y += turn * Math.min(1, dt * 6);

    phase.current += dt * (moving && !talking ? 7 : 0);
    const swing = moving && !talking ? Math.sin(phase.current) * 0.6 : 0;
    const legL = g.getObjectByName("legL");
    const legR = g.getObjectByName("legR");
    const armR = g.getObjectByName("armR");
    const armL = g.getObjectByName("armL");
    if (legL && legR && armL && armR) {
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = talking ? 0 : swing * 0.8;
      armR.rotation.z = talking ? -2.6 - Math.sin(clock.elapsedTime * 9) * 0.35 : 0;
    }

    shown.current += ((talking ? 1 : 0) - shown.current) * Math.min(1, dt * 8);
    if (bubble.current) {
      bubble.current.visible = shown.current > 0.02;
      bubble.current.material.opacity = shown.current;
      bubble.current.position.y = 3.3 * tall + shown.current * 0.3;
    }
    if (mark.current) {
      const k = !met.current && alertFor.current > 0 ? Math.min(1, (0.7 - alertFor.current) * 8 + 0.2) : 0;
      mark.current.visible = k > 0.01;
      mark.current.scale.setScalar(0.9 * k);
    }
  });

  return (
    <group ref={root}>
      <group scale={[1, tall, 1]}>
        {(["legL", "legR"] as const).map((name, i) => (
          <group key={name} name={name} position={[i ? -0.13 : 0.13, 0.9, 0]}>
            <mesh geometry={leg} position-y={-0.42}>
              <meshLambertMaterial color={look.legs} />
            </mesh>
            <mesh geometry={ball} position={[0, -0.86, 0.05]} scale={[0.12, 0.07, 0.17]}>
              <meshLambertMaterial color={look.shoes} />
            </mesh>
          </group>
        ))}
        <mesh geometry={torsoGeo} position-y={1.28} castShadow>
          <meshLambertMaterial color={look.torso} />
        </mesh>
        {look.body}
        {(["armL", "armR"] as const).map((name, i) => (
          <group key={name} name={name} position={[i ? -0.38 : 0.38, 1.55, 0]}>
            <mesh geometry={armGeo} position-y={-0.3}>
              <meshLambertMaterial color={look.arms} />
            </mesh>
            <mesh geometry={ball} position-y={-0.6} scale={0.09}>
              <meshLambertMaterial color={look.skin} />
            </mesh>
            {name === "armR" ? look.hand : null}
          </group>
        ))}
        <group position-y={2.02}>
          <mesh geometry={ball} scale={0.3} castShadow>
            <meshLambertMaterial color={look.skin} />
          </mesh>
          <mesh geometry={ball} position={[0, 0.11, -0.03]} scale={[0.32, 0.24, 0.32]}>
            <meshLambertMaterial color={look.hair} />
          </mesh>
          {look.head}
        </group>
      </group>
      {npc.staff ? null : (
        <sprite ref={mark} position={[0, 2.95 * tall, 0]} visible={false} renderOrder={7}>
          <spriteMaterial map={spottedTexture()} transparent depthWrite={false} />
        </sprite>
      )}
      {plate ? (
        <sprite ref={bubble} scale={[1.7 * plate.aspect, 1.7, 1]} visible={false} renderOrder={6}>
          <spriteMaterial map={plate.texture} transparent depthWrite={false} opacity={0} />
        </sprite>
      ) : null}
    </group>
  );
}

/** Everyone in town (phones get three walkers, plus the staff). */
export function Npcs({ few = false }: { few?: boolean }) {
  const list = useMemo(() => [...(few ? NPCS.filter((_, i) => i === 0 || i >= 3) : NPCS), ...STAFF], [few]);
  return (
    <>
      {list.map((npc, i) => (
        <Person key={npc.line} npc={npc} seed={i} />
      ))}
    </>
  );
}
