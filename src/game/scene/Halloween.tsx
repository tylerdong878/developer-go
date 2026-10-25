"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  type BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  type Group,
  type InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { gyms, raids, stops } from "@/content";
import { slots, trees } from "../base";
import { random } from "../geometry";
import { game } from "../state";
import { town } from "./fade";

/*
 * GO's Halloween map (notes/research/go-round-3.md 1): a ring of carved
 * pumpkins round the foot of every PokéStop and gym, leaf piles on the grass
 * and leaves falling through the air. Stops carve a face or a Poké Ball, gyms
 * a snowflake for Team Mystic (our own mark, GO carves the team's logo). The
 * carvings glow after dark. Three draws for every pumpkin in town, one for
 * the piles, one for the leaves.
 */

/** A pumpkin of radius 1: eight ribs, squat, dimpled on top, with a crooked stem. Vertex colors. */
const PUMPKIN = (() => {
  const body = new SphereGeometry(1, 16, 10);
  const p = body.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    let y = p.getY(i) * 0.74;
    const rib = 0.93 + 0.07 * Math.cos(8 * Math.atan2(x, z));
    if (y > 0.55) y -= (y - 0.55) * 0.6;
    p.setXYZ(i, x * rib, y, z * rib);
  }
  body.computeVertexNormals();
  const stem = new CylinderGeometry(0.08, 0.13, 0.36, 6).rotateZ(0.25).translate(0.04, 0.72, 0);
  const paint = (g: BufferGeometry, hex: string) => {
    const c = new Color(hex);
    g.setAttribute("color", new Float32BufferAttribute(Array.from({ length: g.getAttribute("position").count }, () => [c.r, c.g, c.b]).flat(), 3));
    return g;
  };
  return mergeGeometries([paint(body, "#f07a18"), paint(stem, "#5d6b2a")])!;
})();
const pumpkinMaterial = new MeshLambertMaterial({ vertexColors: true });

/** The carvings, drawn once: a jack-o'-lantern face, a Poké Ball, a snowflake. Dark by day, lit from inside at night. */
function carving(kind: 0 | 1 | 2) {
  const S = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#ffffff";
  g.lineCap = "round";
  if (kind === 0) {
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(64 + s * 18, 18);
      g.lineTo(64 + s * 50, 58);
      g.lineTo(64 + s * 8, 56);
      g.fill();
    }
    g.beginPath();
    g.moveTo(56, 64);
    g.lineTo(64, 76);
    g.lineTo(72, 64);
    g.fill();
    g.beginPath();
    g.moveTo(8, 80);
    for (let k = 0; k <= 8; k++) g.lineTo(8 + k * 14, k % 2 ? 104 : 86);
    g.lineTo(120, 80);
    g.quadraticCurveTo(64, 132, 8, 80);
    g.fill();
  } else if (kind === 1) {
    g.lineWidth = 14;
    g.beginPath();
    g.arc(64, 64, 46, 0, Math.PI * 2);
    g.stroke();
    g.fillRect(18, 57, 92, 14);
    g.beginPath();
    g.arc(64, 64, 17, 0, Math.PI * 2);
    g.fill();
  } else {
    g.lineWidth = 13;
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3;
      g.beginPath();
      g.moveTo(64 - Math.cos(a) * 52, 64 - Math.sin(a) * 52);
      g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52);
      g.stroke();
    }
    g.lineWidth = 9;
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const [x, y] = [64 + Math.cos(a) * 32, 64 + Math.sin(a) * 32];
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a + s * 0.8) * 17, y + Math.sin(a + s * 0.8) * 17);
        g.stroke();
      }
    }
  }
  const map = new CanvasTexture(canvas);
  return new MeshLambertMaterial({ color: "#3a1a08", emissive: "#ffb040", emissiveIntensity: 0, alphaMap: map, alphaTest: 0.5 });
}
/** Made on first use (they need a canvas), then shared. */
let carvings: MeshLambertMaterial[] | null = null;
const carved = () => (carvings ??= [carving(0), carving(1), carving(2)]);
/** A strip of the pumpkin's front, a hair proud of it, for the carving to sit on. */
const CARVE = new CylinderGeometry(1.015, 1.015, 0.95, 10, 1, true, -0.62, 1.24).translate(0, 0.02, 0);

type Spot = { x: number; z: number; turn: number; scale: number; kind: 0 | 1 | 2 };

/** The rings: five round each stop, eight round each gym and raid, all facing out. */
function rings(): Spot[] {
  const out: Spot[] = [];
  const rand = random(1031);
  const ring = (x: number, z: number, n: number, r: number, size: number, carve: (k: number) => 0 | 1 | 2) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.4;
      out.push({ x: x + Math.sin(a) * r, z: z + Math.cos(a) * r, turn: a + (rand() - 0.5) * 0.5, scale: size * (0.85 + rand() * 0.3), kind: carve(k) });
    }
  };
  for (const s of stops) ring(...slots[s.slug], 5, 1.15, 0.32, (k) => (k % 2 ? 1 : 0));
  for (const g of [...gyms, ...raids]) ring(...slots[g.slug], 8, 2.5, 0.42, (k) => (k % 2 ? 2 : 0));
  return out;
}

function Pumpkins() {
  const spots = useMemo(() => rings(), []);
  const group = useRef<Group>(null);
  const counts = [0, 1, 2].map((k) => spots.filter((s) => s.kind === k).length);

  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    const body = g.getObjectByName("pumpkins") as InstancedMesh;
    const cuts = [0, 1, 2].map((k) => g.getObjectByName(`carving-${k}`) as InstancedMesh);
    const o = new Object3D();
    const at = [0, 0, 0];
    spots.forEach((s, i) => {
      o.position.set(s.x, 0.74 * s.scale, s.z);
      o.rotation.set(0, s.turn, 0);
      o.scale.setScalar(s.scale);
      o.updateMatrix();
      body.setMatrixAt(i, o.matrix);
      cuts[s.kind].setMatrixAt(at[s.kind]++, o.matrix);
    });
    for (const m of [body, ...cuts]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    }
  }, [spots]);

  // the carvings light up as night falls
  useFrame(() => {
    for (const m of carved()) m.emissiveIntensity = town.uNight.value * 1.6;
  });

  return (
    <group ref={group}>
      <instancedMesh name="pumpkins" args={[PUMPKIN, pumpkinMaterial, spots.length]} castShadow />
      {carved().map((m, k) => (
        <instancedMesh key={k} name={`carving-${k}`} args={[CARVE, m, counts[k]]} />
      ))}
    </group>
  );
}

/** Leaf piles round the trees: low mounds in fall colors. */
const PILE = new SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
const pileMaterial = new MeshLambertMaterial();
const FALL = ["#c9772e", "#a8642a", "#b09030", "#907050"];

function LeafPiles() {
  const mesh = useRef<InstancedMesh>(null);
  const piles = useMemo(() => {
    const rand = random(4242);
    return trees.filter(() => rand() < 0.6).map(([x, z]) => ({ x: x + (rand() - 0.5) * 3, z: z + (rand() - 0.5) * 3, r: 0.5 + rand() * 0.5, c: FALL[Math.floor(rand() * FALL.length)] }));
  }, []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    const c = new Color();
    piles.forEach((p, i) => {
      o.position.set(p.x, 0, p.z);
      o.scale.set(p.r * 1.4, p.r * 0.35, p.r);
      o.rotation.set(0, p.x * 3.1, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(p.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [piles]);
  return <instancedMesh ref={mesh} args={[PILE, pileMaterial, piles.length]} receiveShadow />;
}

/** Leaves drifting down round the trainer, each spinning as it sways. */
const LEAF = new PlaneGeometry(0.22, 0.14);
const leafMaterial = new MeshLambertMaterial({ side: DoubleSide });
const LEAVES = 70;
const scratch = new Object3D();
const AROUND = 20;

function FallingLeaves() {
  const mesh = useRef<InstancedMesh>(null);
  const leaves = useMemo(() => {
    const rand = random(77);
    return Array.from({ length: LEAVES }, () => ({ x: (rand() - 0.5) * 2 * AROUND, y: rand() * 9, z: (rand() - 0.5) * 2 * AROUND, s: rand() * 6.3, v: 0.5 + rand() * 0.5, c: FALL[Math.floor(rand() * 3)] }));
  }, []);
  const state = useRef(leaves.map((l) => ({ ...l })));
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new Color();
    leaves.forEach((l, i) => m.setColorAt(i, c.set(l.c)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [leaves]);
  useFrame(({ clock }, dt) => {
    const o = scratch;
    const m = mesh.current;
    if (!m) return;
    const { x: px, z: pz } = game.player.trainer.position;
    const t = clock.elapsedTime;
    state.current.forEach((l, i) => {
      l.y -= l.v * Math.min(dt, 0.1);
      // keep them round the trainer: wrap any that drift too far, and send fallen ones back up
      if (l.y < 0.05 || Math.abs(l.x - px) > AROUND || Math.abs(l.z - pz) > AROUND) {
        l.y = 6 + (i % 5);
        l.x = px + (((i * 37) % 40) / 40 - 0.5) * 2 * AROUND;
        l.z = pz + (((i * 53) % 40) / 40 - 0.5) * 2 * AROUND;
      }
      o.position.set(l.x + Math.sin(t * 0.9 + l.s) * 0.6, l.y, l.z + Math.cos(t * 0.7 + l.s) * 0.4);
      o.rotation.set(t * 1.3 + l.s, t * 0.8 + l.s, Math.sin(t * 2 + l.s));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[LEAF, leafMaterial, LEAVES]} frustumCulled={false} />;
}

/** Everything Halloween puts on the map. */
export function Halloween() {
  return (
    <>
      <Pumpkins />
      <LeafPiles />
      <FallingLeaves />
    </>
  );
}
