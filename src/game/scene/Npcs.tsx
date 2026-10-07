"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, type Group, type Sprite, SRGBColorSpace } from "three";
import { circle, ellipse, type Vec2 } from "../geometry";
import { game } from "../state";

/**
 * Other trainers out walking. Each one paces a route, and when you come
 * close they stop, turn, wave, and say something that points you at part of
 * the portfolio.
 */
type Npc = { route: Vec2[]; loop: boolean; line: string; shirt: string; pants: string; hair: string; skin: string; speed: number };

const NPCS: Npc[] = [
  {
    route: [[3.5, -22], [3.5, -92]],
    loop: false,
    line: "Every gym downtown is one of Tyler's jobs. AWS is the tall glass tower.",
    shirt: "#e4573d", pants: "#2b323d", hair: "#2a1d17", skin: "#e8b48f", speed: 2.6,
  },
  {
    route: [[76.5, -60], [76.5, 60]],
    loop: false,
    line: "The PokéStops by the harbor are his quant projects. Spin one!",
    shirt: "#2fd3c6", pants: "#3a3f58", hair: "#e3c06a", skin: "#f1c9a5", speed: 2.4,
  },
  {
    route: [[-60, 37], [30, 37]],
    loop: false,
    line: "Raids are hackathons. The two by the roundabout are his favorites.",
    shirt: "#f6c453", pants: "#4b5a75", hair: "#5a3a26", skin: "#c98e6b", speed: 2.8,
  },
  {
    route: ellipse(-95, -2, 34, 24, 24),
    loop: true,
    line: "Sparkly Pokémon know facts about Tyler. Catch one to find out.",
    shirt: "#a46bf5", pants: "#2b323d", hair: "#1c1c24", skin: "#8d5b3e", speed: 2.2,
  },
  {
    route: circle(0, 0, 13.2, 24),
    loop: true,
    line: "In a hurry? Tap the map in the corner to go anywhere.",
    shirt: "#5fb85a", pants: "#343c48", hair: "#7a4b2a", skin: "#f0c7a4", speed: 1.8,
  },
];

const TALK_WITHIN = 8;

/** A speech bubble, drawn once into a texture. */
function bubbleTexture(text: string) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-nunito-sans") || "sans-serif";
  const font = `700 30px ${family}`;
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d")!;
  g.font = font;
  // wrap to about 22 characters a line
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
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
  g.fillStyle = "#0a2a4a";
  g.textBaseline = "top";
  lines.forEach((l, i) => g.fillText(l, 24, 20 + i * 38));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, aspect: width / height };
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

function Walker({ npc, seed }: { npc: Npc; seed: number }) {
  const root = useRef<Group>(null);
  const bubble = useRef<Sprite>(null);
  const walked = useRef(seed * 37);
  const shown = useRef(0);
  const phase = useRef(0);
  const [plate, setPlate] = useState<{ texture: CanvasTexture; aspect: number } | null>(null);

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
    const here = along(npc.route, npc.loop, walked.current);
    const near = Math.hypot(position.x - here.at[0], position.z - here.at[1]) < TALK_WITHIN;
    if (!near) walked.current += npc.speed * dt;
    const { at, dir } = along(npc.route, npc.loop, walked.current);
    g.position.set(at[0], 0, at[1]);
    const face = near ? Math.atan2(position.x - at[0], position.z - at[1]) : Math.atan2(dir[0], dir[1]);
    let turn = (face - g.rotation.y) % (Math.PI * 2);
    if (turn > Math.PI) turn -= Math.PI * 2;
    if (turn < -Math.PI) turn += Math.PI * 2;
    g.rotation.y += turn * Math.min(1, dt * 6);

    phase.current += dt * (near ? 0 : 7);
    const swing = near ? 0 : Math.sin(phase.current) * 0.6;
    const legL = g.getObjectByName("legL");
    const legR = g.getObjectByName("legR");
    const armR = g.getObjectByName("armR");
    const armL = g.getObjectByName("armL");
    if (legL && legR && armL && armR) {
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      // a wave while talking
      armR.rotation.x = near ? 0 : swing * 0.8;
      armR.rotation.z = near ? 2.6 + Math.sin(clock.elapsedTime * 9) * 0.35 : 0;
    }

    shown.current += ((near ? 1 : 0) - shown.current) * Math.min(1, dt * 8);
    if (bubble.current) {
      bubble.current.visible = shown.current > 0.02;
      bubble.current.material.opacity = shown.current;
      bubble.current.position.y = 3.3 + shown.current * 0.3;
    }
  });

  return (
    <group ref={root}>
      <group name="legL" position={[0.13, 0.9, 0]}>
        <mesh position-y={-0.42}>
          <capsuleGeometry args={[0.12, 0.58, 4, 10]} />
          <meshLambertMaterial color={npc.pants} />
        </mesh>
      </group>
      <group name="legR" position={[-0.13, 0.9, 0]}>
        <mesh position-y={-0.42}>
          <capsuleGeometry args={[0.12, 0.58, 4, 10]} />
          <meshLambertMaterial color={npc.pants} />
        </mesh>
      </group>
      <mesh position-y={1.28} castShadow>
        <capsuleGeometry args={[0.3, 0.42, 4, 12]} />
        <meshLambertMaterial color={npc.shirt} />
      </mesh>
      {(["armL", "armR"] as const).map((name, i) => (
        <group key={name} name={name} position={[i ? -0.38 : 0.38, 1.55, 0]}>
          <mesh position-y={-0.3}>
            <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
            <meshLambertMaterial color={npc.shirt} />
          </mesh>
        </group>
      ))}
      <mesh position-y={2.02} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshLambertMaterial color={npc.skin} />
      </mesh>
      <mesh position={[0, 2.13, -0.03]} scale={[1, 0.75, 1]}>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshLambertMaterial color={npc.hair} />
      </mesh>
      {plate ? (
        <sprite ref={bubble} scale={[1.7 * plate.aspect, 1.7, 1]} visible={false} renderOrder={6}>
          <spriteMaterial map={plate.texture} transparent depthWrite={false} opacity={0} />
        </sprite>
      ) : null}
    </group>
  );
}

/** Everyone out walking (phones get the three nearest home). */
export function Npcs({ few = false }: { few?: boolean }) {
  const list = useMemo(() => (few ? NPCS.filter((_, i) => i === 0 || i >= 3) : NPCS), [few]);
  return (
    <>
      {list.map((npc, i) => (
        <Walker key={npc.line} npc={npc} seed={i} />
      ))}
    </>
  );
}
