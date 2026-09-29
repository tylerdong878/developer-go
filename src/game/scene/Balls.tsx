"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, type Mesh, Quaternion, SRGBColorSpace, Vector3 } from "three";
import { walkable } from "../base";
import { sfx } from "../sound";
import { game } from "../state";

type Ball = { x: number; z: number; vx: number; vz: number; r: number; look: "soccer" | "basket" | "tennis" | "red" };

/** Where each ball starts: on its court, and Teddy's red ball at home. */
const START: Ball[] = [
  { x: -50, z: 58, vx: 0, vz: 0, r: 0.45, look: "soccer" },
  { x: -13, z: 59, vx: 0, vz: 0, r: 0.45, look: "basket" },
  { x: 7, z: 58, vx: 0, vz: 0, r: 0.22, look: "tennis" },
  { x: 3, z: 10, vx: 0, vz: 0, r: 0.32, look: "red" },
];

const FRICTION = 1.6; // per second

function ballTexture(look: Ball["look"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  const base = { soccer: "#f7f7f5", basket: "#e5772e", tennis: "#d8ec4a", red: "#e0342f" }[look];
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 128);
  if (look === "soccer") {
    g.fillStyle = "#1c1c24";
    for (const [x, y] of [[40, 30], [120, 64], [200, 30], [80, 105], [165, 105], [0, 90], [256, 90]]) {
      g.beginPath();
      for (let i = 0; i < 5; i++) g.lineTo(x + Math.cos((i / 5) * Math.PI * 2) * 16, y + Math.sin((i / 5) * Math.PI * 2) * 16);
      g.fill();
    }
  } else if (look === "basket") {
    g.strokeStyle = "#3b1d0e";
    g.lineWidth = 5;
    for (const x of [64, 192]) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 128);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(0, 64);
    g.lineTo(256, 64);
    g.stroke();
  } else if (look === "tennis") {
    g.strokeStyle = "#ffffff";
    g.lineWidth = 6;
    g.beginPath();
    for (let x = 0; x <= 256; x += 4) g.lineTo(x, 64 + Math.sin((x / 256) * Math.PI * 4) * 30);
    g.stroke();
  } else {
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.ellipse(70, 40, 30, 16, -0.4, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/**
 * Balls you can kick around, like the toys in Bruno Simon's portfolio. Walk
 * into one and it rolls off with your speed, spinning as it goes, bouncing
 * off the water and the edge of the base and off the other balls.
 */
export function Balls() {
  const balls = useRef<Ball[]>(START.map((b) => ({ ...b })));
  const meshes = useRef<(Mesh | null)[]>([]);
  const lastKick = useRef(0);
  const textures = useMemo(() => START.map((b) => ballTexture(b.look)), []);
  const spin = useMemo(() => ({ q: new Quaternion(), axis: new Vector3() }), []);

  useFrame(({ clock }, frame) => {
    const dt = Math.min(frame, 0.05);
    const { trainer, buddy } = game.player;
    const list = balls.current;
    list.forEach((b, i) => {
      // Kicks: from Tyler (with his speed) and gentler nudges from Teddy.
      for (const [mover, power] of [[trainer, 1.35], [buddy, 0.8]] as const) {
        const dx = b.x - mover.position.x;
        const dz = b.z - mover.position.z;
        const d = Math.hypot(dx, dz);
        const reach = b.r + 0.55;
        if (d < reach && d > 0.001) {
          const push = Math.min(Math.max(mover.speed, 2.5), 12) * power; // a dash is not a rocket kick
          b.vx += (dx / d) * push;
          b.vz += (dz / d) * push;
          b.x = mover.position.x + (dx / d) * reach;
          b.z = mover.position.z + (dz / d) * reach;
          if (mover === trainer && clock.elapsedTime - lastKick.current > 0.3) {
            lastKick.current = clock.elapsedTime;
            sfx.tap();
          }
        }
      }
      // Balls knock into each other.
      for (let j = i + 1; j < list.length; j++) {
        const o = list[j];
        const dx = o.x - b.x;
        const dz = o.z - b.z;
        const d = Math.hypot(dx, dz);
        const min = b.r + o.r;
        if (d < min && d > 0.001) {
          const nx = dx / d;
          const nz = dz / d;
          const rel = (b.vx - o.vx) * nx + (b.vz - o.vz) * nz;
          if (rel > 0) {
            b.vx -= rel * nx;
            b.vz -= rel * nz;
            o.vx += rel * nx;
            o.vz += rel * nz;
          }
          const fix = (min - d) / 2;
          b.x -= nx * fix;
          b.z -= nz * fix;
          o.x += nx * fix;
          o.z += nz * fix;
        }
      }
      // Roll, slow down, and bounce off anything you can't walk on.
      const nx = b.x + b.vx * dt;
      const nz = b.z + b.vz * dt;
      if (walkable([nx, nz])) {
        b.x = nx;
        b.z = nz;
      } else if (walkable([nx, b.z])) {
        b.x = nx;
        b.vz *= -0.6;
      } else if (walkable([b.x, nz])) {
        b.z = nz;
        b.vx *= -0.6;
      } else {
        b.vx *= -0.6;
        b.vz *= -0.6;
      }
      const slow = Math.exp(-FRICTION * dt);
      b.vx *= slow;
      b.vz *= slow;

      const mesh = meshes.current[i];
      if (!mesh) return;
      mesh.position.set(b.x, b.r, b.z);
      const speed = Math.hypot(b.vx, b.vz);
      if (speed > 0.01) {
        // Rolling: turn around the axis sideways to the motion.
        spin.axis.set(b.vz, 0, -b.vx).normalize();
        spin.q.setFromAxisAngle(spin.axis, (speed * dt) / b.r);
        mesh.quaternion.premultiply(spin.q);
      }
    });
  });

  return (
    <>
      {START.map((b, i) => (
        <mesh
          key={b.look}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          position={[b.x, b.r, b.z]}
          castShadow
        >
          <sphereGeometry args={[b.r, 24, 16]} />
          <meshStandardMaterial map={textures[i]} roughness={b.look === "red" ? 0.3 : 0.6} />
        </mesh>
      ))}
    </>
  );
}
